import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { fetchAuthSession } from "aws-amplify/auth/server";
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/data';
import { cookies } from 'next/headers';
import outputs from '../../amplify/outputs.json';

// CRÍTICO: Usar outputs directamente según documentación oficial Amplify v6
// Server runner para operaciones de autenticación
export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

// Cliente GraphQL con cookies para SSR
export const cookiesClient = generateServerClientUsingCookies({
  config: outputs,
  cookies: cookies,
  authMode: "userPool",
});

export const idToken = async () =>
  await runWithAmplifyServerContext({
    nextServerContext: { cookies: cookies() },
    async operation(contextSpec) {
      try {
        const session = await fetchAuthSession(contextSpec);
        const userName = session.tokens?.idToken?.payload.preferred_username;
        const token = session.tokens?.idToken?.toString();
        console.log(userName, token);
        if (!token || !userName) throw new Error("No token or username");
        return { token, userName };
      } catch (error) {
        console.log("error", error);
        return { token: "", userName: "" };
      }
    },
  });

