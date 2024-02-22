// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import { Container, Dropdown, Nav, NavDropdown, Button, Navbar } from 'react-bootstrap';
import logo from '../../images/logo.png';

export default function NavigationBar({ presentingDetail, onActivitiesShow, user }) {
  return (
    <Navbar className="navbar" variant="dark">
      <Container fluid>
        <Navbar.Brand href="#home" role="heading" aria-level="1" style={{ display: 'flex', alignItems: 'center' }}>
            <img
                style={{ maxHeight: '35px', marginRight: '10px' }}
                src={logo}
                alt="Brand logo"
                aria-hidden="true"
            />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '35px' , fontSize: '1.35rem'}}>
                Authoring Tool
            </div>
        </Navbar.Brand>
        {presentingDetail && <Navbar.Toggle aria-controls="responsive-navbar-nav" />}

        <Navbar.Collapse id="responsive-navbar-nav" className="justify-content-end">
          <Nav className="me-auto">
            {presentingDetail && (
              <Nav.Item>
                <Button className="me-2" variant="light" onClick={onActivitiesShow} size="sm">
                  My Activities
                </Button>
              </Nav.Item>
            )}
          </Nav>

          {/* The zIndex property fixes an issue were the dropdown is displayed below the map layers control */}
          <Nav style={{ zIndex: 1001 }}>
            <NavDropdown id="nav-dropdown-user" title={user.userName} align="end">
              <Dropdown.Header>Signed in as:</Dropdown.Header>
              <Dropdown.ItemText>{user.userName}</Dropdown.ItemText>
              <Dropdown.ItemText>{user.userEmail}</Dropdown.ItemText>
              <NavDropdown.Divider />
              <NavDropdown.Item href="/.auth/logout">Sign out</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
