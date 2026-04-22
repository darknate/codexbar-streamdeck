import streamdeck, {
  action,
  DidReceiveSettingsEvent,
  KeyAction,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
} from "@elgato/streamdeck";

import { persistedSettings, withDefaults } from "../constants";
import { buildState } from "../snapshot";
import { renderTitle } from "../render";
import { SnapshotStore } from "../store";
import type { UsageButtonSettings } from "../types";

interface Subscriber {
  action: KeyAction<UsageButtonSettings>;
  settings: Required<UsageButtonSettings>;
  lastTitle?: string;
  nextPollAt: number;
}

export function getDueSubscriberIds(
  subscribers: ReadonlyMap<string, Pick<Subscriber, "nextPollAt">>,
  now: number,
): string[] {
  return Array.from(subscribers.entries())
    .filter(([, subscriber]) => subscriber.nextPollAt <= now)
    .map(([actionId]) => actionId);
}

class SnapshotPathPoller {
  private readonly subscribers = new Map<string, Subscriber>();
  private timer: NodeJS.Timeout | undefined;
  private inFlight = false;

  constructor(
    private readonly snapshotPath: string,
    private readonly store: SnapshotStore,
  ) {}

  addOrUpdate(action: KeyAction<UsageButtonSettings>, settings: Required<UsageButtonSettings>): void {
    const existing = this.subscribers.get(action.id);
    const now = Date.now();
    this.subscribers.set(action.id, {
      action,
      settings,
      lastTitle: existing?.lastTitle,
      nextPollAt: now + settings.refreshIntervalSec * 1000,
    });
    this.reschedule();
  }

  remove(actionId: string): void {
    if (!this.subscribers.delete(actionId)) {
      return;
    }

    this.reschedule();
  }

  async render(actionId: string, force = false, manual = false): Promise<void> {
    const subscriber = this.subscribers.get(actionId);
    if (!subscriber) {
      return;
    }

    await this.renderSubscriber(subscriber, new Date(), undefined, force, manual);
  }

  isEmpty(): boolean {
    return this.subscribers.size === 0;
  }

  private async poll(): Promise<void> {
    if (this.inFlight || this.subscribers.size === 0) {
      return;
    }

    const now = Date.now();
    const dueSubscriberIds = getDueSubscriberIds(this.subscribers, now);
    if (dueSubscriberIds.length === 0) {
      return;
    }

    this.inFlight = true;
    try {
      const snapshot = await this.store.getSnapshot(this.snapshotPath);
      const renderedAt = new Date(now);

      for (const actionId of dueSubscriberIds) {
        const subscriber = this.subscribers.get(actionId);
        if (!subscriber) {
          continue;
        }

        await this.renderSubscriber(subscriber, renderedAt, snapshot);
        subscriber.nextPollAt = now + subscriber.settings.refreshIntervalSec * 1000;
      }
    } finally {
      this.inFlight = false;
    }
  }

  private async renderSubscriber(
    subscriber: Subscriber,
    now: Date,
    snapshot?: Awaited<ReturnType<SnapshotStore["getSnapshot"]>>,
    force = false,
    manual = false,
  ): Promise<void> {
    try {
      const resolvedSnapshot = snapshot ?? (await this.store.getSnapshot(this.snapshotPath));
      const state = buildState(resolvedSnapshot, subscriber.settings.provider, now, subscriber.settings.staleThresholdSec);
      const title = renderTitle(state);

      if (force || title !== subscriber.lastTitle) {
        await subscriber.action.setTitle(title);
        subscriber.lastTitle = title;
      }

      if (manual) {
        if (state.status === "ok") {
          await subscriber.action.showOk();
        } else {
          await subscriber.action.showAlert();
        }
      }
    } catch (error) {
      const message = error instanceof Error && error.message.includes("ENOENT") ? "No Data" : "Read Err";
      const title = `${capitalize(subscriber.settings.provider)}\n${message}`;

      if (force || title !== subscriber.lastTitle) {
        await subscriber.action.setTitle(title);
        subscriber.lastTitle = title;
      }

      if (manual) {
        await subscriber.action.showAlert();
      }

      streamdeck.logger.warn(`Failed to render ${subscriber.settings.provider}: ${String(error)}`);
    }
  }

  private reschedule(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    if (this.subscribers.size === 0) {
      return;
    }

    const intervalMs = Math.min(...Array.from(this.subscribers.values(), (subscriber) => subscriber.settings.refreshIntervalSec)) * 1000;
    this.timer = setInterval(() => {
      void this.poll();
    }, intervalMs);
  }
}

@action({ UUID: "io.codexbar.usage.usage-button" })
export class UsageButtonAction extends SingletonAction<UsageButtonSettings> {
  private static readonly pollers = new Map<string, SnapshotPathPoller>();
  private static readonly actionToSnapshotPath = new Map<string, string>();
  private static readonly store = new SnapshotStore();

  override async onWillAppear(ev: WillAppearEvent<UsageButtonSettings>): Promise<void> {
    if (!ev.action.isKey()) return;

    const settings = withDefaults(ev.payload.settings);
    const poller = this.subscribe(ev.action, settings);
    await ev.action.setSettings(persistedSettings(ev.payload.settings));
    await poller.render(ev.action.id, true);
  }

  override async onWillDisappear(ev: WillDisappearEvent<UsageButtonSettings>): Promise<void> {
    this.unsubscribe(ev.action.id);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<UsageButtonSettings>): Promise<void> {
    if (!ev.action.isKey()) return;

    const settings = withDefaults(ev.payload.settings);
    const poller = this.subscribe(ev.action, settings);
    await ev.action.setSettings(persistedSettings(ev.payload.settings));
    await poller.render(ev.action.id, true);
  }

  override async onKeyDown(ev: KeyDownEvent<UsageButtonSettings>): Promise<void> {
    const settings = withDefaults(ev.payload.settings);
    const poller = this.subscribe(ev.action, settings);
    await poller.render(ev.action.id, false, true);
  }

  private subscribe(action: KeyAction<UsageButtonSettings>, settings: Required<UsageButtonSettings>): SnapshotPathPoller {
    const previousSnapshotPath = UsageButtonAction.actionToSnapshotPath.get(action.id);
    if (previousSnapshotPath && previousSnapshotPath !== settings.snapshotPath) {
      this.unsubscribe(action.id);
    }

    const poller = UsageButtonAction.getPoller(settings.snapshotPath);
    poller.addOrUpdate(action, settings);
    UsageButtonAction.actionToSnapshotPath.set(action.id, settings.snapshotPath);
    return poller;
  }

  private unsubscribe(actionId: string): void {
    const snapshotPath = UsageButtonAction.actionToSnapshotPath.get(actionId);
    if (!snapshotPath) {
      return;
    }

    const poller = UsageButtonAction.pollers.get(snapshotPath);
    poller?.remove(actionId);
    if (poller?.isEmpty()) {
      UsageButtonAction.pollers.delete(snapshotPath);
    }

    UsageButtonAction.actionToSnapshotPath.delete(actionId);
  }

  private static getPoller(snapshotPath: string): SnapshotPathPoller {
    const existing = this.pollers.get(snapshotPath);
    if (existing) {
      return existing;
    }

    const created = new SnapshotPathPoller(snapshotPath, this.store);
    this.pollers.set(snapshotPath, created);
    return created;
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
