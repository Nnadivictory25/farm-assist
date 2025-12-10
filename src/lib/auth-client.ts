import { createAuthClient } from "better-auth/react";
const { useSession } = createAuthClient();

const authClient = createAuthClient({
    baseURL: "http://localhost:3000",
})


export { authClient, useSession }