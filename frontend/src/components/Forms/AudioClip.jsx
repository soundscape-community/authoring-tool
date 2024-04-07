// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useEffect } from 'react';

export default function AudioClip(props) {
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState(undefined);
  const [description, setDescription] = useState(undefined);

  useEffect(() => {
    if (props.src) {
      setLoading(false);
      setSrc(props.src);
      setDescription(props.description);
    } else if (props.file) {
      setLoading(true);
      loadFile(props.file);
    }
  }, [props.src, props.file, props.description]);

  const loadFile = (file) => {
    let reader = new FileReader();

    reader.onloadend = () => {
      setLoading(false);
      setSrc(reader.result);
    };

    reader.readAsDataURL(file);
  };

  if (!props.src && !props.file) {
    return null;
  }

  if (loading) {
    return <p>loading...</p>;
  }

  return (
    <>
      <audio className="mt-2" controls>
        <source src={src} />
        Your browser does not support HTML audio playback.
      </audio>
      <p className="mb-2">{description}</p>
    </>
  );
};
