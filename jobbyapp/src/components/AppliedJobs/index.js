import { Component } from 'react'
import { Link } from "react-router-dom"
import { jwtDecode } from 'jwt-decode'

import { BsCheckCircleFill } from 'react-icons/bs'
import Loader from 'react-loader-spinner'
import Cookies from 'js-cookie'

import Header from "../Header"
import './index.css'

class AppliedJobsRoute extends Component {
    state = {
        appliedJobs: [],
        isLoading: true,
    }

    componentDidMount() {
        this.getAppliedJobs()
    }

    getAppliedJobs = async () => {
        const jwtToken = Cookies.get('jwt_token')
        const decoded = jwtDecode(jwtToken)
        const userId = decoded.id

        const url = `https://jobby-app-fullstack-project.onrender.com//applied-jobs/${userId}`
        const options = {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${jwtToken}`,
            },
        }

        const response = await fetch(url, options)
        if (response.ok) {
            const data = await response.json()

            const updatedData = data.map(job => ({
                id: job.job_id,
                title: job.role,
                packagePerAnnum: job.package_per_annum,
                companyLogo: job.company_logo_url,
                companyWebsiteUrl: job.company_website_url,
                location: job.location
            }))

            this.setState({ appliedJobs: updatedData, isLoading: false })
        }
    }

    renderAppliedJob = job => (
        <div className="applied-job-card" key={job.id}>
            <div className="job-image-container">
                <img src={job.companyLogo} alt="company logo" className="company-logo" />
                <a
                    href={job.companyWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="applied-link-text"
                    style={{ marginLeft: 2 }}
                >
                    Link
                </a>
            </div>
            <div className="job-info">
                <p className="job-title">{job.title}</p>
                <p className="job-location">{job.location}</p>
            </div>

            <p className="job-package">{job.packagePerAnnum}</p>
            <BsCheckCircleFill size={20} className="applied-icon" />
        </div>
    )
    renderEmptyAppliedJobsView = () => (<div className="no-jobs-container"> <img src="https://res.cloudinary.com/dmxvdaino/image/upload/v1768905854/work-home-concept-flat-design_rw3jv1.png" alt="no applied jobs" className="no-jobs-img" /> <h1 className="no-jobs-heading">No Jobs Applied Till Now</h1> <p className="no-jobs-description"> Apply now and move closer to your dream career! Track all your applications in one place. </p> <Link to="/jobs"> <button type="button" className="shop-now-button"> Find Jobs </button> </Link> </div>)

    render() {
        const { appliedJobs, isLoading } = this.state

        return (
            <>
                <Header />
                <div className="applied-jobs-bg-container">
                    {isLoading ? (
                        <Loader type="ThreeDots" color="#2b6cb0" height={50} width={50} />
                    ) : appliedJobs.length === 0 ? (
                        this.renderEmptyAppliedJobsView()
                    ) : (
                        <>
                            <h2 className="heading">
                                Applied Jobs ({appliedJobs.length})
                            </h2>
                            <div className="applied-jobs-list">
                                {appliedJobs.map(this.renderAppliedJob)}
                            </div>
                        </>
                    )}
                </div>
            </>
        )
    }
}

export default AppliedJobsRoute
