// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import * as yup from 'yup';
import GPXCard from '../ActivitySecondary/GPXCard';

const activitySchema = yup.object().shape({
  file: yup
    .mixed()
    .required('Please select a GPX file')
    .test('is-gpx-valid', 'Please select a valid and non-empty GPX file', async (value) => isGPXFileValid(value)),
});


// const [value, setValue] = useState<File>(undefined);

export default class MapOverlayForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      file: undefined
    };
    
  }

  removeOverlay = () => {
    this.props.onSubmit(null);
  };

  updateOverlay = (overlay) => {
    this.props.onSubmit(overlay);
  };

  render() {
    return (
      <Form
        noValidate
        autoComplete='off'
      >
        {this.props.mapOverlay && (
          <Form.Group>
            <Form.Label>Current Overlay:</Form.Label>
            <GPXCard gpx={this.props.mapOverlay} />
            <Button onClick={this.removeOverlay} variant="outline-danger">
              Remove
            </Button>
            <hr />
          </Form.Group>
        )}
        <Form.Group>
          <Form.Group>
            <Form.Label>
              {this.props.mapOverlay
                ? 'Select a GPX file to replace the current overlay:'
                : 'Select a GPX file to show as an overlay on the map:'}
            </Form.Label>
          </Form.Group>

          <Form.Group>
            <Form.Control
              type="file"
              accept=".gpx, application/gpx+xml, application/octet-stream"
              name="filename"
              // value={value}
              value={this.state.file}
              // isInvalid={}
              onChange={(event) => {
                // if (event.currentTarget.files) {
                //   // setValue(e.currentTarget.files[0]);
                //   this.setState({file: event.currentTarget.files[0]});
                // }
                const upload = event.target.files[0];
                this.setState({ file: upload});
              }}
            >
              
            </Form.Control>

          </Form.Group>
          
        </Form.Group>
      </Form>
    );
  }
}
