import { setFailed } from "@actions/core";
import { setupKubectl } from "./lib/setup-kubectl";

setupKubectl().catch((e) => setFailed(e.message));
