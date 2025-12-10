import { createAuthClient } from "better-auth/react";
const { useSession } = createAuthClient();

const authClient = createAuthClient()


export { authClient, useSession }