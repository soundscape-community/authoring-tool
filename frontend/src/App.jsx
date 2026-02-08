// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import React from 'react';
import Row from 'react-bootstrap/Row';
import { ToastContainer } from 'react-toastify';
import { animateScroll } from 'react-scroll';

import API from './api/API';
import Auth from './api/Auth';
import { showError, showLoading, dismissLoading } from './utils/Toast';
import NavigationBar from './components/Main/NavigationBar';
import Footer from './components/Main/Footer';
import ActivityTable from './components/ActivityPrimary/ActivityTable';
import ActivityDetail from './components/ActivitySecondary/ActivityDetail';
import ActivitiesTable from './components/ActivityPrimary/ActivitiesTable';
import ActivityUpdateModal from './components/Modals/ActivityUpdateModal';
import ActivityDeleteModal from './components/Modals/ActivityDeleteModal';
import ActivityDuplicateModal from './components/Modals/ActivityDuplicateModal';
import ActivityPublishModal from './components/Modals/ActivityPublishModal';
import WaypointDeleteModal from './components/Modals/WaypointDeleteModal';
import WaypointUpdateModal from './components/Modals/WaypointUpdateModal';
import ActivityLinkModal from './components/Modals/ActivityLinkModal';
import MapOverlayModal from './components/Modals/MapOverlayModal';
import ActivityImportModal from './components/Modals/ActivityImportModal';
import FolderDeleteModal from './components/Modals/FolderDeleteModal';
import FolderRenameModal from './components/Modals/FolderRenameModal';
import FolderShareModal from './components/Modals/FolderShareModal';
import InvalidWindowSizeAlert from './components/Main/InvalidWindowSizeAlert';
import PrivacyAlertModal from './components/Modals/PrivacyAlertModal';
import Login from './components/auth/Login';
import MainContext from './components/Main/MainContext';

export default class App extends React.Component {
  static STORAGE_KEYS = Object.freeze({
    DID_ACCEPT_PRIVACY_AGREEMENT: 'did_accept_privacy_agreement',
  });

  constructor(props) {
    super(props);

    this.state = {
      isScreenSizeValid: this.isScreenSizeValid,

      user: {},
      activities: [], // Holds activities metadata excluding waypoints
      folders: [],
      selectedFolderId: null,
      selectedActivity: null, // Holds the selected activity including it's waypoints
      selectedWaypoint: null,
      editing: false,
      mapOverlay: null,
      waypointCreateType: null,

      // Activity modals
      showModalPrivacyAlert: this.shouldShowPrivacyAlert,
      showModalMapOverlay: false,
      showModalFolderRename: false,
      showModalFolderDelete: false,
      showModalFolderShare: false,
      showModalActivityCreate: false,
      showModalActivityImport: false,
      showModalActivityUpdate: false,
      showModalActivityDelete: false,
      showModalActivityDuplicate: false,
      showModalActivityPublish: false,
      showModalActivityLink: false,

      // Waypoints modals
      showModalWaypointCreate: false,
      showModalWaypointUpdate: false,
      showModalWaypointDelete: false,
    };

    this.bindActions();
  }

  bindActions() {
    // Actions

    this.dismissModal = this.dismissModal.bind(this);
    this.toggleEditing = this.toggleEditing.bind(this);

    // Activities

    this.showActivities = this.showActivities.bind(this);
    this.activitySelected = this.activitySelected.bind(this);
    this.activityCreated = this.activityCreated.bind(this);
    this.activityImported = this.activityImported.bind(this);
    this.activityUpdated = this.activityUpdated.bind(this);
    this.activityDeleted = this.activityDeleted.bind(this);
    this.activityDuplicated = this.activityDuplicated.bind(this);
    this.activityPublished = this.activityPublished.bind(this);
    this.folderSelected = this.folderSelected.bind(this);
    this.folderCreated = this.folderCreated.bind(this);
    this.folderRenameModal = this.folderRenameModal.bind(this);
    this.folderDeleteModal = this.folderDeleteModal.bind(this);
    this.folderShareModal = this.folderShareModal.bind(this);
    this.folderRenamed = this.folderRenamed.bind(this);
    this.folderDeleted = this.folderDeleted.bind(this);
    this.loadFolders = this.loadFolders.bind(this);

    // Waypoints

    this.waypointSelected = this.waypointSelected.bind(this);
    this.waypointCreateModal = this.waypointCreateModal.bind(this);
    this.waypointCreated = this.waypointCreated.bind(this);
    this.waypointUpdateModal = this.waypointUpdateModal.bind(this);
    this.waypointUpdated = this.waypointUpdated.bind(this);
    this.waypointDeleteModal = this.waypointDeleteModal.bind(this);
    this.waypointDeleted = this.waypointDeleted.bind(this);
    this.setUser = this.setUser.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);

    this.authenticate()
      .then((user) => {
        this.setState({
          user,
        });
        this.loadFolders();
        this.loadActivities();
      })
      .catch((error) => {
        error.title = 'Error authenticating user';
        // do not show error on login screen upon component mount
        // showError(error);
      });
  }

  // Actions

  get shouldShowPrivacyAlert() {
    const storedValue = localStorage.getItem(App.STORAGE_KEYS.DID_ACCEPT_PRIVACY_AGREEMENT);
    return !storedValue || storedValue !== 'true';
  }

  get isScreenSizeValid() {
    return window.innerWidth > 1000 && window.innerHeight > 500;
  }

  handleResize = (event) => {
    this.setState({ isScreenSizeValid: this.isScreenSizeValid });
  };

  dismissModal(modalId) {
    this.setState({
      [modalId]: false, // Same as `const state = {}; state[modalId] = false;`
    });
  }

  didAcceptPrivacyAgreement = () => {
    localStorage.setItem(App.STORAGE_KEYS.DID_ACCEPT_PRIVACY_AGREEMENT, 'true');

    this.setState({
      showModalPrivacyAlert: this.shouldShowPrivacyAlert,
    });
  };

  toggleEditing() {
    this.setState({
      editing: !this.state.editing,
      selectedWaypoint: null,
    });
  }

  scrollToBottom() {
    animateScroll.scrollToBottom({ containerId: 'primary' });
  }

  scrollToTop() {
    animateScroll.scrollToTop({ containerId: 'primary' });
  }

  ///////////////////////////////////////////////////////////
  // User
  ///////////////////////////////////////////////////////////

  setUser(user) {
    console.log('setUser', user);
    this.setState({ user });
    console.log('setUser', this.state.user);
  }

  async authenticate() {
    return Auth.fetchAuthInfo();
  }

  ///////////////////////////////////////////////////////////
  // ACTIVITIES
  ///////////////////////////////////////////////////////////

  loadActivities() {
    const toastId = showLoading('Loading activities...');

    API.getActivities(this.state.selectedFolderId)
      .then((activities) => {
        this.setState({
          activities,
          //selectedActivity: activities[0],
        });
      })
      .catch((error) => {
        error.title = 'Error loading activities';
        showError(error);
      })
      .finally(() => {
        dismissLoading(toastId);
      });
  }

  showActivities() {
    this.setState({
      selectedActivity: null,
      selectedWaypoint: null,
      editing: false,
      mapOverlay: null,
    });
  }

  ///////////////////////////////////////////////////////////
  // FOLDERS
  ///////////////////////////////////////////////////////////

  loadFolders() {
    API.getFolders()
      .then((folders) => {
        this.setState({ folders });
      })
      .catch((error) => {
        error.title = 'Error loading folders';
        showError(error);
      });
  }

  folderSelected(folderId) {
    this.setState(
      {
        selectedFolderId: folderId,
        selectedActivity: null,
        selectedWaypoint: null,
        editing: false,
      },
      () => this.loadActivities(),
    );
  }

  folderCreated() {
    const folderName = window.prompt('Folder name');
    if (!folderName) {
      return;
    }

    const parent =
      this.state.selectedFolderId && this.state.selectedFolderId !== 'none'
        ? this.state.selectedFolderId
        : null;

    API.createFolder({ name: folderName, parent })
      .then(() => {
        this.loadFolders();
      })
      .catch((error) => {
        error.title = 'Error creating folder';
        showError(error);
      });
  }

  getSelectedFolder() {
    return this.state.folders.find((folder) => folder.id === this.state.selectedFolderId) || null;
  }

  getDescendantFolderIds(rootId) {
    const childrenMap = new Map();
    this.state.folders.forEach((folder) => {
      const parentId = folder.parent || null;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId).push(folder.id);
    });

    const ids = new Set();
    const queue = [rootId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || ids.has(currentId)) {
        continue;
      }
      ids.add(currentId);
      const children = childrenMap.get(currentId) || [];
      children.forEach((childId) => queue.push(childId));
    }

    return Array.from(ids);
  }

  buildActivityFolderUpdatePayload(activity, folderId) {
    return {
      id: activity.id,
      author_id: activity.author_id,
      author_name: activity.author_name,
      author_email: activity.author_email,
      name: activity.name,
      description: activity.description,
      type: activity.type,
      start: activity.start,
      end: activity.end,
      expires: activity.expires,
      image_alt: activity.image_alt,
      folder: folderId,
    };
  }

  folderRenameModal() {
    if (!this.state.selectedFolderId || this.state.selectedFolderId === 'none') {
      return;
    }

    this.setState({ showModalFolderRename: true });
  }

  folderDeleteModal() {
    if (!this.state.selectedFolderId || this.state.selectedFolderId === 'none') {
      return;
    }

    this.setState({ showModalFolderDelete: true });
  }

  folderShareModal() {
    if (!this.state.selectedFolderId || this.state.selectedFolderId === 'none') {
      return;
    }

    this.setState({ showModalFolderShare: true });
  }

  folderRenamed() {
    this.setState({ showModalFolderRename: false });
    this.loadFolders();
  }

  async moveActivitiesToUnfoldered(folderId) {
    const folderIds = this.getDescendantFolderIds(folderId);
    if (folderIds.length === 0) {
      return;
    }

    const activityLists = await Promise.all(folderIds.map((id) => API.getActivities(id)));
    const activities = activityLists.flat();
    if (activities.length === 0) {
      return;
    }

    await Promise.all(
      activities.map((activity) =>
        API.updateActivityPartial(this.buildActivityFolderUpdatePayload(activity, null)),
      ),
    );
  }

  async folderDeleted({ moveActivities }) {
    const folder = this.getSelectedFolder();
    if (!folder) {
      return;
    }

    const toastId = showLoading('Deleting folder...');

    try {
      if (moveActivities) {
        await this.moveActivitiesToUnfoldered(folder.id);
      }
      await API.deleteFolder(folder.id);
      this.setState(
        {
          showModalFolderDelete: false,
          selectedFolderId: null,
          selectedActivity: null,
          selectedWaypoint: null,
          editing: false,
        },
        () => {
          this.loadFolders();
          this.loadActivities();
        },
      );
    } catch (error) {
      error.title = 'Error deleting folder';
      showError(error);
      throw error;
    } finally {
      dismissLoading(toastId);
    }
  }

  activitySelected(activity) {
    const toastId = showLoading('Loading activity...');

    API.getActivity(activity.id)
      .then((activity) => {
        this.setState({
          selectedActivity: activity,
          editing: false,
        });
      })
      .catch((error) => {
        error.title = 'Error loading activity';
        showError(error);
      })
      .finally(() => {
        dismissLoading(toastId);
      });
  }

  activityCreated(activity) {
    this.setState({
      selectedActivity: activity,
      editing: true,
      showModalActivityCreate: false,
    });

    this.loadActivities();
  }

  activityImported(activity) {
    this.setState({
      selectedActivity: activity,
      editing: false,
      showModalActivityImport: false,
    });

    this.loadActivities();
  }

  activityUpdated(activity) {
    this.setState({
      selectedActivity: activity,
      showModalActivityUpdate: false,
    });

    this.loadActivities();
  }

  activityDeleted(activity) {
    this.setState({
      showModalActivityDelete: false,
    });

    this.showActivities();
    this.loadActivities();
  }

  activityDuplicated(activity) {
    this.setState({
      showModalActivityDuplicate: false,
    });

    this.activitySelected(activity);
    this.loadActivities();

    this.scrollToTop();
  }

  activityPublished(activity) {
    this.setState({
      showModalActivityPublish: false,
    });

    this.activitySelected(activity);
    this.loadActivities();

    this.scrollToTop();
  }

  ///////////////////////////////////////////////////////////
  // WAYPOINTS
  ///////////////////////////////////////////////////////////

  waypointSelected(waypoint) {
    this.setState({
      selectedWaypoint: waypoint,
    });
  }

  waypointCreateModal(type) {
    this.setState({
      waypointCreateType: type,
      showModalWaypointCreate: true,
    });
  }

  waypointCreated(waypoint) {
    this.setState({
      showModalWaypointCreate: false,
    });

    const { selectedActivity } = this.state;

    const toastId = showLoading('Loading activity...');

    API.getActivity(selectedActivity.id)
      .then((activity) => {
        this.setState(
          {
            selectedActivity: activity,
          },
          this.scrollToBottom,
        );
      })
      .catch((error) => {
        error.title = 'Error loading activity';
        showError(error);
      })
      .finally(() => {
        dismissLoading(toastId);
      });
  }

  waypointUpdateModal(waypoint) {
    this.setState({
      selectedWaypoint: waypoint,
      showModalWaypointUpdate: true,
    });
  }

  waypointUpdated(waypoint) {
    this.setState({
      showModalWaypointUpdate: false,
    });

    const { selectedActivity } = this.state;

    const toastId = showLoading('Loading activity...');

    API.getActivity(selectedActivity.id)
      .then((activity) => {
        this.setState({
          selectedActivity: activity,
        });
      })
      .catch((error) => {
        error.title = 'Error loading activity';
        showError(error);
      })
      .finally(() => {
        dismissLoading(toastId);
      });
  }

  waypointMovedUp = (waypoint) => {
    this.waypointMoved(waypoint, 1);
  };

  waypointMovedDown = (waypoint) => {
    this.waypointMoved(waypoint, -1);
  };

  waypointMoved = (waypoint, offset) => {
    const updated = Object.assign({}, waypoint);
    updated.index += offset;

    const toastId = showLoading('Updating waypoint...');

    API.updateWaypoint(updated)
      .then((waypoint) => {
        const { selectedActivity } = this.state;
        API.getActivity(selectedActivity.id)
          .then((activity) => {
            this.setState({
              selectedActivity: activity,
            });
          })
          .catch((error) => {
            error.title = 'Error loading activity';
            showError(error);
          });
      })
      .catch((error) => {
        error.title = 'Error updating waypoint index';
        showError(error);
      })
      .finally(() => {
        dismissLoading(toastId);
      });
  };

  waypointDeleteModal(waypoint) {
    this.setState({
      selectedWaypoint: waypoint,
      showModalWaypointDelete: true,
    });
  }

  waypointDeleted(waypoint) {
    this.setState({
      showModalWaypointDelete: false,
    });

    const { selectedActivity } = this.state;

    const toastId = showLoading('Deleting waypoint...');

    API.getActivity(selectedActivity.id)
      .then((activity) => {
        this.setState({
          selectedWaypoint: null,
          selectedActivity: activity,
        });
      })
      .catch((error) => {
        error.title = 'Error loading activity';
        showError(error);
      })
      .finally(() => {
        dismissLoading(toastId);
      });
  }

  mapOverlayUpdated = (mapOverlay) => {
    this.setState({
      mapOverlay,
      showModalMapOverlay: false,
    });
  };

  render() {
    return (
      <MainContext.Provider value={{ user: this.state.user, setUser: this.setUser }}>
        <div className="App">
          {this.state.isScreenSizeValid ? (
            <>
              <ToastContainer />

              <NavigationBar
                user={this.state.user}
                onActivitiesShow={this.showActivities}
                presentingDetail={this.state.selectedActivity}
              />

              <main className="main container-fluid">
                <Row className="main-row">
                  {/* Primary */}
                  {(!this.state.user.userName)?(<Login/>):
                  this.state.selectedActivity ? (
                    <ActivityTable
                      activity={this.state.selectedActivity}
                      editing={this.state.editing}
                      onActivityUpdate={() => {
                        this.setState({ showModalActivityUpdate: true });
                      }}
                      onShowActivities={this.showActivities}
                      onWaypointSelected={this.waypointSelected}
                      onWaypointCreate={this.waypointCreateModal}
                      onWaypointDelete={this.waypointDeleteModal}
                      onWaypointUpdate={this.waypointUpdateModal}
                      onWaypointMovedUp={this.waypointMovedUp}
                      onWaypointMovedDown={this.waypointMovedDown}
                    />
                  ) : (
                    <ActivitiesTable
                      activities={this.state.activities}
                      folders={this.state.folders}
                      selectedFolderId={this.state.selectedFolderId}
                      onFolderSelect={this.folderSelected}
                      onFolderCreate={this.folderCreated}
                      onFolderRename={this.folderRenameModal}
                      onFolderDelete={this.folderDeleteModal}
                      onFolderShare={this.folderShareModal}
                      onActivitySelected={this.activitySelected}
                      onActivityCreate={() => {
                        this.setState({ showModalActivityCreate: true });
                      }}
                      onActivityImport={() => {
                        this.setState({ showModalActivityImport: true });
                      }}
                    />
                  )}

                  {/* Secondary */}
                  <ActivityDetail
                    activity={this.state.selectedActivity}
                    selectedWaypoint={this.state.selectedWaypoint}
                    editing={this.state.editing}
                    mapOverlay={this.state.mapOverlay}
                    onToggleEditing={this.toggleEditing}
                    onMapOverlay={() => {
                      this.setState({ showModalMapOverlay: true });
                    }}
                    onActivityDelete={() => {
                      this.setState({ showModalActivityDelete: true });
                    }}
                    onActivityDuplicate={() => {
                      this.setState({ showModalActivityDuplicate: true });
                    }}
                    onActivityPublish={() => {
                      this.setState({ showModalActivityPublish: true });
                    }}
                    onActivityLink={() => {
                      this.setState({ showModalActivityLink: true });
                    }}
                    onWaypointCreated={this.waypointCreated}
                    onWaypointUpdated={this.waypointUpdated}
                  />
                </Row>
              </main>

              <Footer></Footer>

              {/* Models */}

              <PrivacyAlertModal onAccept={this.didAcceptPrivacyAgreement} show={this.state.showModalPrivacyAlert} />

              <MapOverlayModal
                show={this.state.showModalMapOverlay}
                mapOverlay={this.state.mapOverlay}
                onCancel={this.dismissModal.bind(this, 'showModalMapOverlay')}
                onDone={this.mapOverlayUpdated}
              />

              {/* Activities */}

              <FolderRenameModal
                show={this.state.showModalFolderRename}
                folder={this.getSelectedFolder()}
                onCancel={this.dismissModal.bind(this, 'showModalFolderRename')}
                onRename={this.folderRenamed}
              />

              <FolderDeleteModal
                show={this.state.showModalFolderDelete}
                folder={this.getSelectedFolder()}
                onCancel={this.dismissModal.bind(this, 'showModalFolderDelete')}
                onDelete={this.folderDeleted}
              />

              <FolderShareModal
                show={this.state.showModalFolderShare}
                folder={this.getSelectedFolder()}
                onCancel={this.dismissModal.bind(this, 'showModalFolderShare')}
              />

              <ActivityUpdateModal
                show={this.state.showModalActivityCreate}
                creating={true}
                folders={this.state.folders}
                onCancel={this.dismissModal.bind(this, 'showModalActivityCreate')}
                onDone={this.activityCreated}
              />

              <ActivityImportModal
                show={this.state.showModalActivityImport}
                onCancel={this.dismissModal.bind(this, 'showModalActivityImport')}
                onDone={this.activityImported}
              />

              <ActivityUpdateModal
                show={this.state.showModalActivityUpdate}
                creating={false}
                activity={this.state.selectedActivity}
                folders={this.state.folders}
                onCancel={this.dismissModal.bind(this, 'showModalActivityUpdate')}
                onDone={this.activityUpdated}
              />

              <ActivityDeleteModal
                show={this.state.showModalActivityDelete}
                activity={this.state.selectedActivity}
                onCancel={this.dismissModal.bind(this, 'showModalActivityDelete')}
                onDelete={this.activityDeleted}
              />

              <ActivityDuplicateModal
                show={this.state.showModalActivityDuplicate}
                activity={this.state.selectedActivity}
                onCancel={this.dismissModal.bind(this, 'showModalActivityDuplicate')}
                onDuplicate={this.activityDuplicated}
              />

              <ActivityPublishModal
                show={this.state.showModalActivityPublish}
                activity={this.state.selectedActivity}
                onCancel={this.dismissModal.bind(this, 'showModalActivityPublish')}
                onPublish={this.activityPublished}
              />

              <ActivityLinkModal
                show={this.state.showModalActivityLink}
                activity={this.state.selectedActivity}
                onCancel={this.dismissModal.bind(this, 'showModalActivityLink')}
              />

              {/* Waypoints */}

              <WaypointUpdateModal
                show={this.state.showModalWaypointCreate}
                creating={true}
                waypointType={this.state.waypointCreateType}
                activity={this.state.selectedActivity}
                onCancel={this.dismissModal.bind(this, 'showModalWaypointCreate')}
                onDone={this.waypointCreated}
              />

              <WaypointUpdateModal
                show={this.state.showModalWaypointUpdate}
                creating={false}
                waypoint={this.state.selectedWaypoint}
                activity={this.state.selectedActivity}
                onCancel={this.dismissModal.bind(this, 'showModalWaypointUpdate')}
                onDone={this.waypointUpdated}
              />

              <WaypointDeleteModal
                show={this.state.showModalWaypointDelete}
                waypoint={this.state.selectedWaypoint}
                onCancel={this.dismissModal.bind(this, 'showModalWaypointDelete')}
                onDelete={this.waypointDeleted}
              />
            </>
          ) : (
            <InvalidWindowSizeAlert />
          )}
        </div>
      </MainContext.Provider>
    );
  }
}
