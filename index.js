const express = require('express')
const cors = require('cors')
const graphqlHTTP = require('express-graphql')
const gql = require('graphql-tag')
const { buildASTSchema } = require('graphql')
const app = express()
app.use(cors())
var firebase = require('firebase');

const config = {
  apiKey: "AIzaSyBL1GBsJ5P3rISjVL-6IqMS6qC7pqDnLx8",
  authDomain: "mixed-6439a.firebaseapp.com",
  databaseURL: "https://mixed-6439a.firebaseio.com",
  projectId: "mixed-6439a",
  storageBucket: "mixed-6439a.appspot.com",
  messagingSenderId: "53070088836"
}

var data = '';
const fire = firebase.initializeApp(config);
fire.database().ref().on('value', snapshot => {
  // data = JSON.stringify(snapshot.val());
  data = snapshot.val();
});

const schema = buildASTSchema(gql`
  type Query {
    posts: [Post]
    post(id: ID): Post
    authors: [Person]
    author(id: ID): Person
    data: String
    user(id: ID): User
    app(id: ID, app: ID): String
  }

  type Post {
    id: ID
    author: Person
    body: String
  }

  type Person {
    id: ID
    posts: [Post]
    firstName: String
    lastName: String
  }

  type User {
    Apps: String
  }


`)

const PEOPLE = new Map()
const POSTS = new Map()

class Post {
  constructor(data) { Object.assign(this, data) }
  get author() {
    return PEOPLE.get(this.authorId)
  }
}

class Person {
  constructor(data) { Object.assign(this, data) }
  get posts() {
    return [...POSTS.values()].filter(post => post.authorId === this.id)
  }
}

const rootValue = {
  posts: () => POSTS.values(),
  post: ({ id }) => POSTS.get(id),
  authors: () => PEOPLE.values(),
  author: ({ id }) => PEOPLE.get(id),
  data: () => data,
  user: ({ id }) => getUser(id),
  app: ({ id, app }) => getApp(id, app),
}

function getApp(id, app) {
  var userData = "";
  fire.database().ref().child(id).child("Apps").child(app).on('value', snapshot => {
    // userData = JSON.stringify(snapshot.val());
    userData = JSON.stringify(snapshot.val());
  })
  return userData;
}

function getUser(id) {
  var userData = "";
  fire.database().ref().child(id).on('value', snapshot => {
    // userData = JSON.stringify(snapshot.val());
    userData = snapshot.val();
  })
  return userData;
}

const initializeData = () => {
  const fakePeople = [
    { id: '1', firstName: 'John', lastName: 'Doe' },
    { id: '2', firstName: 'Jane', lastName: 'Doe' }
  ]

  fakePeople.forEach(person => PEOPLE.set(person.id, new Person(person)))

  const fakePosts = [
    { id: '1', authorId: '1', body: 'Hello world' },
    { id: '2', authorId: '2' }
  ]

  fakePosts.forEach(post => POSTS.set(post.id, new Post(post)))
}

initializeData()

app.use('/api/graphql', graphqlHTTP({ schema, rootValue }));

app.get('/api', function (req, res) {
  var user = req.query.user;
  var app = req.query.app;
  var userData = "";
  fire.database().ref().child(user).child("Apps").child(app).on('value', snapshot => {
    // userData = JSON.stringify(snapshot.val());
    userData = JSON.stringify(snapshot.val());
  })
  return res.send(userData);
});

const port = process.env.PORT || 4000
app.listen(port)
console.log(`Running a GraphQL API server at localhost:${port}/graphql`)