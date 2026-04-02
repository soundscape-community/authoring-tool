// Copyright (c) Soundscape Community Contributors.
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ActivityLinkModal from '../ActivityLinkModal';

vi.mock('react-bootstrap/Modal', () => {
  const Modal = ({ show, children }) => (show ? <div>{children}</div> : null);
  const ModalHeader = ({ children }) => <div>{children}</div>;
  const ModalTitle = ({ children }) => <div>{children}</div>;
  const ModalBody = ({ children }) => <div>{children}</div>;

  Modal.displayName = 'MockModal';
  ModalHeader.displayName = 'MockModalHeader';
  ModalTitle.displayName = 'MockModalTitle';
  ModalBody.displayName = 'MockModalBody';

  Modal.Header = ModalHeader;
  Modal.Title = ModalTitle;
  Modal.Body = ModalBody;

  return { default: Modal };
});

vi.mock('qrcode.react', () => ({
  QRCodeCanvas: ({ value, size, includeMargin, bgColor, fgColor, ...props }) => (
    <canvas data-value={value} data-size={size} {...props} />
  ),
}));

describe('ActivityLinkModal', () => {
  const activity = {
    id: 'activity-123',
    name: 'City Tour',
    unpublished_changes: true,
  };

  let clipboardWriteMock;
  let createObjectUrlMock;
  let revokeObjectUrlMock;
  let originalCreateElement;
  let anchorClickMock;
  let createdAnchor;

  beforeEach(() => {
    clipboardWriteMock = vi.fn(() => Promise.resolve());
    createObjectUrlMock = vi.fn(() => 'blob:qr-code');
    revokeObjectUrlMock = vi.fn();
    anchorClickMock = vi.fn();
    createdAnchor = null;
    originalCreateElement = document.createElement.bind(document);

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        write: clipboardWriteMock,
      },
    });

    window.ClipboardItem = class ClipboardItem {
      constructor(items) {
        this.items = items;
      }
    };

    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      configurable: true,
      writable: true,
      value: vi.fn((callback) => callback(new Blob(['qr-code'], { type: 'image/png' }))),
    });

    vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectUrlMock);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revokeObjectUrlMock);
    vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      const element = originalCreateElement(tagName, options);

      if (tagName === 'a') {
        createdAnchor = element;
        element.click = anchorClickMock;
      }

      return element;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete window.ClipboardItem;
  });

  function renderModal(overrides = {}) {
    render(<ActivityLinkModal show={true} activity={activity} onCancel={() => {}} {...overrides} />);
  }

  it('renders the QR actions, warning, and share link', () => {
    renderModal();

    expect(screen.getByText('Unpublished Changes Warning')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy QR Code' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download QR Code' })).toBeInTheDocument();
    expect(screen.getByLabelText('Activity QR code')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'https://share.soundscape.services/v3/experience?id=activity-123' }),
    ).toBeInTheDocument();
  });

  it('copies the QR code image to the clipboard when supported', async () => {
    const user = userEvent.setup();

    Object.defineProperty(window.navigator, 'clipboard', {
      configurable: true,
      value: {
        write: clipboardWriteMock,
      },
    });

    renderModal();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Copy QR Code' }));
    });

    await waitFor(() => expect(screen.getByText('QR code copied to clipboard.')).toBeInTheDocument());

    const clipboardItems = clipboardWriteMock.mock.calls[0][0];
    expect(clipboardWriteMock).toHaveBeenCalled();
    expect(clipboardItems).toHaveLength(1);
    expect(clipboardItems[0].items['image/png']).toBeInstanceOf(Blob);
    expect(clipboardItems[0].items['image/png'].type).toBe('image/png');
  });

  it('shows a fallback message when image clipboard support is unavailable', async () => {
    const user = userEvent.setup();

    delete window.ClipboardItem;

    renderModal();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Copy QR Code' }));
    });

    expect(
      screen.getByText('This browser cannot copy images to the clipboard. Use Download QR Code instead.'),
    ).toBeInTheDocument();
    expect(clipboardWriteMock).not.toHaveBeenCalled();
  });

  it('shows a fallback message when QR image export fails', async () => {
    const user = userEvent.setup();
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => callback(null));

    renderModal();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Copy QR Code' }));
    });

    await waitFor(() =>
      expect(screen.getByText('Unable to copy the QR code. Use Download QR Code instead.')).toBeInTheDocument(),
    );
  });

  it('downloads the QR code as a PNG with an activity-based filename', async () => {
    const user = userEvent.setup();

    renderModal();

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Download QR Code' }));
    });

    await waitFor(() => expect(createObjectUrlMock).toHaveBeenCalledTimes(1));

    expect(createdAnchor).not.toBeNull();
    expect(createdAnchor.download).toBe('city-tour-qr.png');
    expect(createdAnchor.href).toBe('blob:qr-code');
    expect(anchorClickMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:qr-code'));
    expect(screen.getByText('QR code download started.')).toBeInTheDocument();
  });

  it('shows a fallback message when downloading the QR code fails', async () => {
    const user = userEvent.setup();
    createObjectUrlMock.mockImplementationOnce(() => {
      throw new Error('Blob URL blocked');
    });

    renderModal();
    const anchorCountBeforeDownload = document.createElement.mock.calls.filter(([tagName]) => tagName === 'a').length;

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Download QR Code' }));
    });

    await waitFor(() => expect(screen.getByText('Unable to download the QR code.')).toBeInTheDocument());

    const anchorCountAfterDownload = document.createElement.mock.calls.filter(([tagName]) => tagName === 'a').length;

    expect(anchorCountAfterDownload).toBe(anchorCountBeforeDownload);
    expect(anchorClickMock).not.toHaveBeenCalled();
    expect(revokeObjectUrlMock).not.toHaveBeenCalled();
  });
});
