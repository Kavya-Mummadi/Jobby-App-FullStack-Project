import { Component } from 'react'
import { Route, Switch, Redirect } from 'react-router-dom'

import SignUp from "./components/SignUp"
import Login from './components/Login'
import Home from './components/Home'
import Jobs from './components/Jobs'
import AppliedJobs from './components/AppliedJobs'
import JobItemDetails from './components/JobItemDetails'
import NotFound from './components/NotFound'
import ProtectedRoute from './components/ProtectedRoute'

import './App.css'

class App extends Component {
  render() {
    return (
      <Switch>
        <Route exact path="/signup" component={SignUp} />
        <Route exact path="/login" component={Login} />
        <ProtectedRoute exact path="/" component={Home} />
        <ProtectedRoute exact path="/jobs" component={Jobs} />
        <ProtectedRoute exact path="/jobs/:id" component={JobItemDetails} />
        <ProtectedRoute exact path="/applied-jobs" component={AppliedJobs} />
        <Route exact path="/">
          <Redirect to="/signup" />
        </Route>
        <Route path="/not-found" component={NotFound} />
        <Redirect to="not-found" />
      </Switch>

    )
  }
}

export default App
