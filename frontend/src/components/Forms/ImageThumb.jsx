// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React, { useState, useEffect } from 'react';
import { Image } from 'react-bootstrap';

export default function ImageThumb(props) {
  const [loading, setLoading] = useState(true);
  const [thumb, setThumb] = useState(undefined);
  const [alt, setAlt] = useState(undefined);

  useEffect(() => {
    if (props.src) {
      setLoading(false);
      setThumb(props.src);
      setAlt(props.alt);
    } else if (props.file) {
      setLoading(true);
      loadFile(props.file);
    }
  }, [props.src, props.file]);

  const loadFile = (file) => {
    let reader = new FileReader();

    reader.onloadend = () => {
      setLoading(false);
      setThumb(reader.result);
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
      <Image className="mb-2" src={thumb} alt={alt} thumbnail fluid height={160} width={160} />
      <p className="mb-1">{alt}</p>
    </>
  );
};
