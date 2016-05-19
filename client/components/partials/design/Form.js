import React from 'react';
import GithubForm from './GithubForm.js';
import MiddlewareForm from './MiddlewareForm.js';
import { reduxForm } from 'redux-form';
import { hashHistory } from 'react-router';

// Import storage to reset it
import storage from '../../../storage.js';
import { connect } from 'react-redux';
import '../../../../node_modules/sweetalert/dist/sweetalert.min.js';
import '../../../../node_modules/sweetalert/dist/sweetalert.css';

export const fields = [
  'configName',
  'port',
  'github.repoName',
  'github.privacy',
  'github.description',
  'middleware.morgan',
  'middleware.cookieparser',
  'middleware.bodyparserJson',
  'middleware.bodyparserUrlencoded',
];

/* Form validation function */
const validate = values => {
  const errors = {};
  if (!values.configName) {
    errors.configName = 'Required';
  } else if (values.configName.length > 15) {
    errors.configName = 'Must be 15 characters or less';
  }
  if (values.port && !/^\d{1,4}\s*$/.test(values.port)) {
    errors.port = 'Port must be an integer between 0 and 9999';
  } else if (values.port && values.port.length > 5) {
    errors.port = 'Must be 5 characters or less';
  }
  const githubErrors = {};
  if (values.github.description && values.github.description.length > 200) {
    githubErrors.description = 'Description should be 200 characters or fewer';
  }
  if (!values.github.repoName) {
    githubErrors.repoName = 'Required';
  }
  errors.github = githubErrors;
  return errors;
};

@connect(null, dispatch => ({
  resetState: () => {
    dispatch({ type: 'RESET_STATE' });
  },
}))
@reduxForm({
  form: 'config',
  fields,
  validate,
})
export default class Form extends React.Component {
  static propTypes = {
    fields: React.PropTypes.object.isRequired,
    handleSubmit: React.PropTypes.func.isRequired,
    submitting: React.PropTypes.bool.isRequired,
    routers: React.PropTypes.array,
    resetState: React.PropTypes.func.isRequired,
    createPrompt: React.PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      serverType: null,
      isValid: true,
    };
  }

  validateRouters() {
    return !this.props.routers.some((router) =>
      (router.validation.name === false
        || router.validation.startPoint === false));
  }

  sendData = (formData) => {
    if (!this.validateRouters()) {
      return this.setState({ isValid: false });
    }
    hashHistory.push('/loading');
    const resetState = this.props.resetState;
    const jsonData = {
      data: {
        serverType: formData.serverType,
        appName: formData.configName,
        serverSettings: {
          port: formData.port,
          expressName: formData.expressName,
        },
        routers: this.props.routers,
        middleware: {
          morgan: formData.middleware.morgan,
          cookieparser: formData.middleware.cookieparser,
          bodyparserJson: formData.middleware.bodyparserJson,
          bodyparserUrlencoded: formData.middleware.bodyparserUrlencoded,
        },
        github: {
          repoName: formData.github.repoName,
          privacy: formData.github.privacy || false,
          description: formData.github.description,
        },
      },
    };

    fetch('/serve', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(jsonData),
      credentials: 'same-origin',
    })
    .then(response => {
      response.json().then(obj => {
        resetState();
        storage.remove('app_state');
        hashHistory.push(`/success/${obj.user}/${obj.repoName}/`);
      });
    })
    .catch(err => console.log('darn:  ', err));
  }

  saveData = (formData) => {
    const resetState = this.props.resetState;
    const jsonData = {
      user: document.cookie.split(';')[3],
      data: {
        serverType: formData.serverType,
        appName: formData.configName,
        serverSettings: {
          port: formData.port,
          expressName: formData.expressName,
        },
        routers: this.props.routers,
        github: {
          repoName: formData.github.repoName,
          privacy: formData.github.privacy || false,
          description: formData.github.description,
        },
      },
    };
    console.log(jsonData);

    fetch('/config', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(jsonData),
      credentials: 'same-origin',
    })
      .then(() => {
       swal('Configuration Saved!', '', 'success');
      })
      .catch(err => console.log('darn:  ', err));
  }

  render() {
    const { fields: { configName, port, github, middleware }, handleSubmit, submitting } = this.props;
    const displayRouterError = () => this.state.isValid ? 'none' : 'block';
    return (
      <form className="serverSettings">
        <div>
          <div className="serverLabel">Config Name</div>
          <div>
            {configName.touched && configName.error && <div className="error">{configName.error}</div>}
            <input className={(configName.touched && configName.error) ? 'error' : null}
              type="text" name="configName" placeholder="MyApp" required {...configName} autoFocus
            />
          </div>
        </div>
        <div className="express">
          <div className="serverLabel">Port</div>
          <div>
            {port.touched && port.error && <div className="error">{port.error}</div>}
            <input className={(port.touched && port.error) ? 'error' : null}
              type="text" name="port" placeholder="8000" {...port}
            />
          <br />
          </div>
        </div>
        <MiddlewareForm {...middleware} />
        <GithubForm {...github} />
        <div>
        <br />
        </div>
        <button onClick={handleSubmit(this.saveData)}
          name="submitConfig" className="btn btn-save"
        >Save
        </button>
         <div>
        <br />
        </div>
        <div className="error" style={{ display: displayRouterError() }}>
          Error: Check for duplicate routers.
        </div>
        <button disabled={submitting} onClick={handleSubmit(this.sendData)}
          name="submitConfig" className="btn btn-submit"
        >Build Server
        </button>
      </form>
    );
  }
}
