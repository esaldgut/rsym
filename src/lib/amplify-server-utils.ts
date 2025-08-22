import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import outputs from '../../amplify/outputs.json';

export const { runWithAmplifyServerContext } = createServerRunner({
  config: {
    Auth: {
      Cognito: {
        userPoolId: outputs.auth.user_pool_id,
        userPoolClientId: outputs.auth.user_pool_client_id,
        identityPoolId: outputs.auth.identity_pool_id,
        loginWith: {
          oauth: {
            domain: outputs.auth.oauth.domain,
            scopes: outputs.auth.oauth.scopes as ('email' | 'openid' | 'profile')[],
            redirectSignIn: outputs.auth.oauth.redirect_sign_in.split(','),
            redirectSignOut: outputs.auth.oauth.redirect_sign_out.split(','),
            responseType: outputs.auth.oauth.response_type as 'code',
            providers: {
              Google: {
                clientId: process.env.GOOGLE_CLIENT_ID || ''
              },
              Apple: {
                clientId: process.env.APPLE_CLIENT_ID || ''
              }
            }
          }
        }
      }
    },
    API: {
      GraphQL: {
        endpoint: outputs.data.url,
        region: outputs.data.aws_region,
        defaultAuthMode: 'userPool'
      }
    },
    Storage: {
      S3: {
        bucket: outputs.storage.bucket_name,
        region: outputs.storage.aws_region
      }
    }
  }
});