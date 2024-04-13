import passport from 'passport';
import { Strategy, Issuer, generators } from 'openid-client';

const setupOIDC = async () => {
  try {
    const issuer = await Issuer.discover('https://gitlab.oit.duke.edu'); // Discover your OIDC issuer's configuration
    const client = new issuer.Client({
      client_id: '11da9c7449f9a5801bf23e09b18e67d5cf957f37206fbdeb1bcf271468ae0834',
      client_secret: 'gloas-2982e75be02ae5119da9a3795ebfd0e66975e2601dffc56c3a996f6f2e5b9e22',
      redirect_uris: ['http://localhost:8131/auth/callback'],
      response_types: ['code'],
    });

   const params = {
    scope: 'openid profile email',
    nonce: generators.nonce(),
    state: generators.state()
   }
   function verify(tokenSet: any, userInfo: any, done: (error: any, user: any) => void) {
    console.log('userInfo', userInfo)
    console.log('tokenSet', tokenSet)
    return done(null, userInfo)
  }
  passport.use('oidc', new Strategy( { client, params }, verify))

  } catch (error) {
    console.error('OIDC setup failed:', error);
  }
};

export { setupOIDC };