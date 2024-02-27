// // Copyright (c) Microsoft Corporation.
// // Licensed under the MIT License.

// import React from 'react';
// import { Form, Button } from 'react-bootstrap';
// import { Formik } from 'formik';
// import * as yup from 'yup';
// import GPXCard from '../ActivitySecondary/GPXCard';
// import { fileToGPX, getFileGPX, isGPXFileValid } from '../../utils/GPXUtils';

// const activitySchema = yup.object().shape({
//   file: yup
//     .mixed()
//     .required('Please select a GPX file')
//     .test('is-gpx-valid', 'Please select a valid and non-empty GPX file', async (value) => isGPXFileValid(value)),
// });

// export default class MapOverlayForm extends React.Component {
//   removeOverlay = () => {
//     this.props.onSubmit(null);
//   };

//   updateOverlay = (overlay) => {
//     this.props.onSubmit(overlay);
//   };

//   render() {
//     return (
//       <Formik
//         validationSchema={activitySchema}
//         initialValues={{ filename: undefined, file: undefined, gpx: undefined }}
//         onSubmit={(values) => {
//           this.updateOverlay(values.gpx);
//         }}>
//         {({ handleSubmit, handleChange, handleBlur, values, setFieldValue, touched, isValid, errors }) => (
//           <Form noValidate onSubmit={handleSubmit} autoComplete="off">
//             {this.props.mapOverlay && (
//               <Form.Group>
//                 <Form.Label>Current Overlay:</Form.Label>
//                 <GPXCard gpx={this.props.mapOverlay} />
//                 <Button onClick={this.removeOverlay} variant="outline-danger">
//                   Remove
//                 </Button>
//                 <hr />
//               </Form.Group>
//             )}

//             <Form.Group>
//               <Form.Group>
//                 <Form.Label>
//                   {this.props.mapOverlay
//                     ? 'Select a GPX file to replace the current overlay:'
//                     : 'Select a GPX file to show as an overlay on the map:'}
//                 </Form.Label>
//               </Form.Group>

//               <Form.Group>
//                 <Form.Control
//                   className="mb-3"
//                   type="file"
//                   accept=".gpx, application/gpx+xml, application/octet-stream"
//                   name="filename"
//                   value={values.filename}
//                   onBlur={handleBlur}
//                   isInvalid={touched.filename && errors.file}
//                   onChange={(event) => {
//                     const file = event.currentTarget.files[0];
//                     console.log(file);
//                     setFieldValue('file', file);
//                     values.file = file;
//                     console.log("HEREEEEEEEEEEEEEEEE");
//                     console.log(values.file);
//                     console.log(errors.file);
//                     console.log(errors);
//                     handleChange(event);
//                     console.log("HANDLED CHANGE");

//                     // fileToGPX(file)
//                     //   .then((gpx) => {
//                     //     console.log("gpx");
//                     //     console.log(gpx);
//                     //     setFieldValue('gpx', gpx);
//                     //   })
//                     //   .catch(() => {
//                     //     console.log("CATCHED");
//                     //     setFieldValue('gpx', undefined);
//                     //   })
//                     //   .finally(() => {
//                     //     console.log("FINALLY");
//                     //     handleChange(event);
//                     //   });
//                     const gpx = getFileGPX(file);
//                     console.log('GPX ------------ ');
//                     console.log(gpx);
//                     if (gpx === null) {
//                       setFieldValue('gpx', undefined);
//                     } else {
//                       setFieldValue('gpx', gpx);
//                     }
//                     handleChange(event);
//                   }}
//                 />
//                 <Form.Control.Feedback className="mb-2" type="invalid">
//                   {errors.file}
//                 </Form.Control.Feedback>
//                 {values.gpx && <GPXCard gpx={values.gpx} />}
//               </Form.Group>
//             </Form.Group>

//             {/* The `touched` property does not seem to report the correct values in Safari */}
//             <Button variant="primary" type="submit" /*disabled={values.file === null || !isValid}*/>
//               {this.props.mapOverlay ? 'Replace' : 'Add'}
//             </Button>
//           </Form>
//         )}
//       </Formik>
//     );
//   }
// }
