// backend/src/routes/me.ts

import { verifyToken } from "../middleware/auth.js";
import { mongoUserStore } from "../stores/mongoUserStore.js";
import { createMeRouter } from "./meRouter.js";

export default createMeRouter({ store: mongoUserStore, verify: verifyToken });
