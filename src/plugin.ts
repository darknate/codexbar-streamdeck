import streamDeck from "@elgato/streamdeck";

import { UsageButtonAction } from "./actions/usage-button";

streamDeck.logger.setLevel("info");
streamDeck.actions.registerAction(new UsageButtonAction());
streamDeck.connect();

