import { Component, } from 'react'
import { Link, withRouter } from 'react-router-dom'
import './index.css'

class SignUp extends Component {
    state = {
        name: '',
        email: '',
        password: '',
        bio: '',
        phone_number: '',
        showSubmitError: false,
        errorMsg: ''
    }

    onChangeName = event => this.setState({ name: event.target.value })
    onChangeEmail = event => this.setState({ email: event.target.value })
    onChangePassword = event => this.setState({ password: event.target.value })
    onChangePhoneNumber = event => this.setState({ phone_number: event.target.value })
    onChangeBio = event => this.setState({ bio: event.target.value })

    onSubmitSuccess = () => {
        this.setState({
            name: '',
            email: '',
            password: '',
            phone_number: '',
            showSubmitError: false,
            errorMsg: '', bio: ''
        })
        this.props.history.push('/login')
    }

    onSubmitFailure = errorMsg => {
        this.setState({ showSubmitError: true, errorMsg })
    }

    submitForm = async event => {
        event.preventDefault()
        const { name, email, password, phone_number, bio } = this.state
        const userDetails = { name, email, password, phone_number, bio }

        try {
            const response = await fetch('http://localhost:5000/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userDetails)
            })

            const data = await response.json()

            if (response.ok) {
                // This calls your method that clears state and redirects
                this.onSubmitSuccess()
            } else {
                // Uses the error_msg sent from backend
                this.onSubmitFailure(data.error_msg)
            }
        } catch (err) {
            this.onSubmitFailure('Network error. Please try again.')
        }
    }

    render() {
        const { name, email, password, phone_number, showSubmitError, errorMsg, bio } = this.state

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
                            value={name}
                            className="username-input-field"
                            onChange={this.onChangeName}
                            placeholder="Name"
                        />
                    </div>
                    <div className="input-container">
                        <label className="input-label" htmlFor="email">EMAIL</label>
                        <input
                            type="email"
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
                    <div className="input-container">
                        <label className="input-label" htmlFor="phone_number">PHONE NUMBER</label>
                        <input
                            type="text"
                            id="phone_number"
                            value={phone_number}
                            className="password-input-field"
                            onChange={this.onChangePhoneNumber}
                            placeholder="Phone Number"
                        />
                    </div>
                    <div className="input-container">
                        <label className="input-label" htmlFor="bio">SHORT BIO</label>
                        <textarea
                            id="bio"
                            value={bio}
                            className="password-input-field"
                            onChange={this.onChangeBio}
                            placeholder="Tell me about role"
                        />
                    </div>
                    <button type="submit" className="login-button">Sign Up</button>
                    {showSubmitError && <p className="error-message">*{errorMsg}</p>}
                    <p className="redirect-text">
                        Already registered? <Link to="/login" className="login-link-text">Login</Link>
                    </p>
                </form>
            </div>
        )
    }
}
export default withRouter(SignUp)
