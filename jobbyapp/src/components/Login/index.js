import { Component } from 'react'
import { Redirect, Link } from 'react-router-dom'
import Cookies from 'js-cookie'
import './index.css'

class Login extends Component {
    state = { username: '', email: '', password: '', showSubmitError: false, errorMsg: '' }

    onChangeUsername = event => this.setState({ username: event.target.value })
    onChangePassword = event => this.setState({ password: event.target.value })
    onChangeEmail = event => this.setState({ email: event.target.value })

    onSubmitSuccess = jwtToken => {
        const { history } = this.props
        Cookies.set('jwt_token', jwtToken, { expires: 30 })
        history.replace('/')
    }

    onSubmitFailure = errorMsg => this.setState({ errorMsg, showSubmitError: true })

    submitForm = async event => {
        event.preventDefault()
        const { username, email, password } = this.state
        const userDetails = { name: username, email, password }

        const apiUrl = 'http://localhost:5000/login'
        const options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userDetails),
        }

        const response = await fetch(apiUrl, options)
        const data = await response.json()

        if (response.ok === true) {
            this.onSubmitSuccess(data.jwt_token)
        } else {
            this.onSubmitFailure(data.error_msg)
        }
    }

    render() {
        const { username, password, email, showSubmitError, errorMsg } = this.state
        const token = Cookies.get('jwt_token')
        if (token !== undefined) return <Redirect to="/" />

        return (
            <div className="login-container">
                <form className="form-container" onSubmit={this.submitForm}>
                    <img
                        src="https://assets.ccbp.in/frontend/react-js/logo-img.png"
                        className="login-website-logo"
                        alt="website logo"
                    />
                    <div className="input-container">
                        <label className="input-label" htmlFor="name">NAME</label>
                        <input
                            type="text"
                            id="name"
                            value={username}
                            className="username-input-field"
                            onChange={this.onChangeUsername}
                            placeholder="name"
                        />
                    </div>
                    <div className="input-container">
                        <label className="input-label" htmlFor="email">Email</label>
                        <input
                            type="text"
                            id="email"
                            value={email}
                            className="email-input-field"
                            onChange={this.onChangeEmail}
                            placeholder="Email"
                        />
                    </div>
                    <div className="input-container">
                        <label className="input-label" htmlFor="password">PASSWORD</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            className="password-input-field"
                            onChange={this.onChangePassword}
                            placeholder="Password"
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                    {showSubmitError && <p className="error-message">*{errorMsg}</p>}
                    <p className="redirect-text">
                        New user? <Link to="/signup" className="login-link-text">Sign Up</Link>
                    </p>
                </form>
            </div>
        )
    }
}

export default Login
