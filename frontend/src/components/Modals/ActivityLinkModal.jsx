// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Alert } from 'react-bootstrap';
import { QRCodeCanvas } from 'qrcode.react';

const SHARE_DOMAIN = (import.meta.env.VITE_SHARE_DOMAIN || 'https://share.soundscape.services').replace(/\/+$/, '');
const QR_CODE_SIZE = 288;
const COPY_UNSUPPORTED_MESSAGE = 'This browser cannot copy images to the clipboard. Use Download QR Code instead.';
const COPY_FAILURE_MESSAGE = 'Unable to copy the QR code. Use Download QR Code instead.';
const COPY_SUCCESS_MESSAGE = 'QR code copied to clipboard.';
const DOWNLOAD_FAILURE_MESSAGE = 'Unable to download the QR code.';
const DOWNLOAD_SUCCESS_MESSAGE = 'QR code download started.';

export default class ActivityLinkModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      qrStatus: null,
      qrStatusVariant: 'success',
    };

    this.qrCodeContainerRef = React.createRef();
  }

  componentDidUpdate(prevProps) {
    const modalChanged = prevProps.show !== this.props.show;
    const activityChanged = prevProps.activity?.id !== this.props.activity?.id;

    if ((modalChanged || activityChanged) && this.state.qrStatus !== null) {
      this.setState({ qrStatus: null, qrStatusVariant: 'success' });
    }
  }

  buildQrFilename() {
    const activitySlug = (this.props.activity?.name || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${activitySlug || 'activity'}-qr.png`;
  }

  getQrCanvas() {
    return this.qrCodeContainerRef.current?.querySelector('canvas') || null;
  }

  setQrStatus(qrStatus, qrStatusVariant = 'success') {
    this.setState({ qrStatus, qrStatusVariant });
  }

  canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      if (typeof canvas?.toBlob !== 'function') {
        reject(new Error(DOWNLOAD_FAILURE_MESSAGE));
        return;
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error(DOWNLOAD_FAILURE_MESSAGE));
          return;
        }

        resolve(blob);
      }, 'image/png');
    });
  }

  handleCopyQrCode = async () => {
    const clipboard = navigator.clipboard;
    const ClipboardItemCtor = window.ClipboardItem;

    if (!clipboard?.write || !ClipboardItemCtor) {
      this.setQrStatus(COPY_UNSUPPORTED_MESSAGE, 'warning');
      return;
    }

    try {
      const canvas = this.getQrCanvas();
      const blob = await this.canvasToBlob(canvas);

      await clipboard.write([new ClipboardItemCtor({ 'image/png': blob })]);
      this.setQrStatus(COPY_SUCCESS_MESSAGE);
    } catch (error) {
      this.setQrStatus(COPY_FAILURE_MESSAGE, 'warning');
    }
  };

  handleDownloadQrCode = async () => {
    try {
      const canvas = this.getQrCanvas();
      const blob = await this.canvasToBlob(canvas);
      const objectUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');

      downloadLink.href = objectUrl;
      downloadLink.download = this.buildQrFilename();
      downloadLink.click();

      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      this.setQrStatus(DOWNLOAD_SUCCESS_MESSAGE);
    } catch (error) {
      this.setQrStatus(DOWNLOAD_FAILURE_MESSAGE, 'danger');
    }
  };

  render() {
    const activityId = this.props.activity?.id;
    const link = activityId ? `${SHARE_DOMAIN}/v3/experience?id=${activityId}` : null;

    return (
      <Modal
        show={this.props.show}
        onHide={this.props.onCancel}
        backdrop="static"
        centered
        aria-labelledby="contained-modal-title-vcenter">
        <Modal.Header closeButton>
          <Modal.Title>Link to Activity</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.props.activity?.unpublished_changes === true && (
            <Alert variant="warning">
              <Alert.Heading>Unpublished Changes Warning</Alert.Heading>
              This activity contains unpublished changes. To update the activity accessed via the public link, select
              Publish prior to sending this link.
            </Alert>
          )}
          <p>
            To start or share this activity, scan the code with your mobile device camera, or copy and paste the link to
            your device browser. Make sure you have{' '}
            <a href="https://apps.apple.com/app/idXXXXXXXXXX" target="_blank" rel="noreferrer">
              Your App
            </a>{' '}
            installed on your device.
          </p>
          <p>
            <b>Note:</b>
            <br></br>
            Before an event, try to send participants the link via e-mail and also take a photo of the QR code on your
            phone. At the day of the event, participants without the link can use their phone to scan the QR code from
            your phone.
          </p>
          {link && (
            <>
              <div className="text-center" ref={this.qrCodeContainerRef}>
                <QRCodeCanvas
                  value={link}
                  size={QR_CODE_SIZE}
                  includeMargin={true}
                  bgColor="#FFFFFF"
                  fgColor="#000000"
                  aria-label="Activity QR code"
                />
              </div>
              <div className="d-flex justify-content-center gap-2 mt-3">
                <Button variant="outline-secondary" onClick={this.handleCopyQrCode}>
                  Copy QR Code
                </Button>
                <Button variant="outline-secondary" onClick={this.handleDownloadQrCode}>
                  Download QR Code
                </Button>
              </div>
              {this.state.qrStatus && (
                <Alert className="mt-3 mb-0" variant={this.state.qrStatusVariant}>
                  {this.state.qrStatus}
                </Alert>
              )}
              <br />
              <a href={link} target="_blank" rel="noreferrer">
                {link}
              </a>
            </>
          )}
        </Modal.Body>
      </Modal>
    );
  }
}
