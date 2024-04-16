# mafia

Needs to have the following features:
▪ Responsive Vue/router frontend, Node backend, MongoDB database
▪ A form (besides login) showing at least 4 fields
▪ Either a scale-out REST API or a Socket.IO-based central server
▪ Supports multiple authenticated users
▪ Basic E2E test suite
▪ Runs on Kubernetes

Extras:
▪ CI/CD pipeline (to be discussed later in the course)
▪ Admin user role and role-based access control (RBAC) for non-admins
▪ GraphQL-based API (requires some self study)
▪ Scale out Socket.IO server layer (requires some self study)


Running: 
server:
docker run -p 127.0.0.1:27017:27017 -d --rm --name mongo mongo:7.0.5
npm run setup 
npm start 

ui/general
npm run dev
npm install moment (for timestamp)


MVP: 
- deployment
- E2E testing
- one state at a time (we can add more)
- chat component (done)
- sidebar component
- vote component 
- functionality for voting 
- mutations in graphQL, chaange player information + game state information in db



