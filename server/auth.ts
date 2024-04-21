import passport from 'passport';
import { Strategy, Issuer, generators } from 'openid-client';
import { Strategy as CustomStrategy } from 'passport-custom';

const mode = process.env.ENV_MODE;
let callbackPort: String;
if (mode === 'production') {
  callbackPort = '31001';
} else {
  callbackPort = '8131';
}

const setupOIDC = async () => {
  try {
    passport.use("disable-security", new CustomStrategy((req, done) => {
      if (req.query.key !== 'disable-security') {
        console.log("you must supply ?key=" + 'disable_security' + " to log in via DISABLE_SECURITY")
        done(null, false)
      } else {
        console.log("Test")
        const user = {
          id: "10402",
          name: "E2E Test",
          email: "jj312@duke.edu", 
          roles:[ "admin" ]
      };
        done(null, user)
      }
    }))


    const issuer = await Issuer.discover('https://gitlab.oit.duke.edu'); // Discover your OIDC issuer's configuration
    const client = new issuer.Client({
      client_id: '11da9c7449f9a5801bf23e09b18e67d5cf957f37206fbdeb1bcf271468ae0834',
      client_secret: 'gloas-2982e75be02ae5119da9a3795ebfd0e66975e2601dffc56c3a996f6f2e5b9e22',
      redirect_uris: [`http://localhost:${callbackPort}/api/callback`],
      response_types: ['code'],
    });

   const params = {
    scope: 'openid profile email',
    nonce: generators.nonce(),
    state: generators.state()
   }
   async function verify(tokenSet: any, userInfo: any, done: any) {
    console.log("OIDC verification:", userInfo);
    userInfo.roles = userInfo.groups.includes("mafia-admin") ? ["admin"] : ["user"]
    return done(null, userInfo)
}
passport.use('oidc', new Strategy( { client, params }, verify))

  } catch (error) {
    console.error('OIDC setup failed:', error);
  }
};

export { setupOIDC };
