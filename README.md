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
- Run Dockerfiles to create UI and server images
    - docker build -t ui/mafia-ui .
    - docker build -t server/mafia-server .
- Create k8 pods
    - kubectl create -f k8s


MVP: 
- deployment
- E2E testing
- one state at a time (we can add more)
- chat component (done)
- sidebar component
- vote component 
- functionality for voting 
- mutations in graphQL, chaange player information + game state information in db



