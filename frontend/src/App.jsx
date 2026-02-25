// Copyright (c) Soundscape Community Contributors.
// Licensed under the MIT License.

import React from 'react';
import Row from 'react-bootstrap/Row';
import { ToastContainer } from 'react-toastify';
import { animateScroll } from 'react-scroll';

import API from './api/API';
import Auth from './api/Auth';
import { showError, showLoading, dismissLoading } from './utils/Toast';
import { buildFolderIndex, getDescendantIds } from './utils/folderIndex';
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
import ActivityBulkDeleteModal from './components/Modals/ActivityBulkDeleteModal';
import ActivityBulkMoveModal from './components/Modals/ActivityBulkMoveModal';
import FolderCreateModal from './components/Modals/FolderCreateModal';
import FolderDeleteModal from './components/Modals/FolderDeleteModal';
import FolderRenameModal from './components/Modals/FolderRenameModal';
import FolderShareModal from './components/Modals/FolderShareModal';
import InvalidWindowSizeAlert from './components/Main/InvalidWindowSizeAlert';
import EnvironmentWarningBanner from './components/Main/EnvironmentWarningBanner';
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
      showBetaWarning: false,
      betaWarningMessage: '',

      user: {},
      activities: [], // Holds activities metadata excluding waypoints
      folders: [],
      selectedFolderId: null,
      selectedActivity: null, // Holds the selected activity including it's waypoints
      selectedWaypoint: null,
      editing: false,
      mapOverlay: null,
      waypointCreateType: null,
      selectedActivityIds: [],
      newFolderParent: null,

      // Activity modals
      showModalPrivacyAlert: this.shouldShowPrivacyAlert,
      showModalMapOverlay: false,
      showModalFolderCreate: false,
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
      showModalActivityBulkDelete: false,
      showModalActivityBulkMove: false,

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
    this.activityToggleSelected = this.activityToggleSelected.bind(this);
    this.activityToggleAll = this.activityToggleAll.bind(this);
    this.activityBulkMoveModal = this.activityBulkMoveModal.bind(this);
    this.activityBulkDeleteModal = this.activityBulkDeleteModal.bind(this);
    this.activityBulkMove = this.activityBulkMove.bind(this);
    this.activityBulkDelete = this.activityBulkDelete.bind(this);
    this.folderSelected = this.folderSelected.bind(this);
    this.folderCreated = this.folderCreated.bind(this);
    this.openFolderCreateModal = this.openFolderCreateModal.bind(this);
    this.folderCreateSubmitted = this.folderCreateSubmitted.bind(this);
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

    this.loadRuntimeConfig();

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

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
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

  /**
   * Reload the currently selected activity from the API.
   * @param {Object} [stateOverrides] - Extra state merged into the setState call.
   * @param {Function} [callback] - Optional callback passed to setState.
   */
  reloadSelectedActivity(stateOverrides = {}, callback = undefined) {
    const { selectedActivity } = this.state;
    if (!selectedActivity) {
      return null;
    }
    const toastId = showLoading('Loading activity...');

    API.getActivity(selectedActivity.id)
      .then((activity) => {
        this.setState({ selectedActivity: activity, ...stateOverrides }, callback);
      })
      .catch((error) => {
        error.title = 'Error loading activity';
        showError(error);
      })
      .finally(() => {
        dismissLoading(toastId);
      });
  }

  ///////////////////////////////////////////////////////////
  // User
  ///////////////////////////////////////////////////////////

  setUser(user) {
    this.setState({ user });
  }

  async authenticate() {
    return Auth.fetchAuthInfo();
  }

  loadRuntimeConfig() {
    API.getRuntimeConfig()
      .then((config) => {
        this.setState({
          showBetaWarning: Boolean(config.show_beta_warning),
          betaWarningMessage: config.beta_warning_message || 'Testing environment — all changes will be lost.',
        });
      })
      .catch(() => {
        this.setState({ showBetaWarning: false });
      });
  }

  ///////////////////////////////////////////////////////////
  // ACTIVITIES
  ///////////////////////////////////////////////////////////

  loadActivities(selectedActivityIds = []) {
    const toastId = showLoading('Loading activities...');

    API.getActivities(this.state.selectedFolderId)
      .then((activities) => {
        this.setState({
          activities,
          selectedActivityIds: selectedActivityIds.filter((id) =>
            activities.some((activity) => activity.id === id),
          ),
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
        selectedActivityIds: [],
      },
      () => this.loadActivities(),
    );
  }

  folderCreated() {
    this.openFolderCreateModal(this.state.selectedFolderId);
  }

  openFolderCreateModal(selectedFolderId) {
    this.setState({
      newFolderParent: selectedFolderId || null,
      showModalFolderCreate: true,
    });
  }

  folderCreateSubmitted({ name, parent }) {
    return API.createFolder({ name, parent })
      .then(() => {
        this.loadFolders();
      })
      .catch((error) => {
        error.title = 'Error creating folder';
        showError(error);
      })
      .finally(() => {
        this.setState({
          showModalFolderCreate: false,
          newFolderParent: null,
        });
      });
  }

  getSelectedFolder() {
    return this.state.folders.find((folder) => folder.id === this.state.selectedFolderId) || null;
  }

  getDescendantFolderIds(rootId) {
    const { byParent } = buildFolderIndex(this.state.folders);
    return Array.from(getDescendantIds(byParent, rootId));
  }

  buildActivityFolderUpdatePayload(activity, folderId) {
    return {
      id: activity.id,
      folder: folderId,
    };
  }

  folderRenameModal() {
    if (!this.state.selectedFolderId) {
      return;
    }

    this.setState({ showModalFolderRename: true });
  }

  folderDeleteModal() {
    if (!this.state.selectedFolderId) {
      return;
    }

    this.setState({ showModalFolderDelete: true });
  }

  folderShareModal() {
    if (!this.state.selectedFolderId) {
      return;
    }

    this.setState({ showModalFolderShare: true });
  }

  folderRenamed() {
    this.setState({ showModalFolderRename: false });
    this.loadFolders();
  }

  async moveActivitiesToUnfoldered(folderId) {
    const BATCH_SIZE = 20;
    const folderIds = this.getDescendantFolderIds(folderId);
    if (folderIds.length === 0) {
      return;
    }

    const activityLists = [];
    const fetchFailures = [];

    for (let i = 0; i < folderIds.length; i += BATCH_SIZE) {
      const batch = folderIds.slice(i, i + BATCH_SIZE);
      const settledResults = await Promise.allSettled(batch.map((id) => API.getActivities(id)));
      settledResults.forEach((result, index) => {
        const currentFolderId = batch[index];
        if (result.status === 'fulfilled') {
          activityLists.push(result.value);
          return;
        }
        fetchFailures.push({
          folderId: currentFolderId,
          message: result.reason?.message || 'Unknown error',
        });
      });
    }

    const activitiesById = new Map();
    activityLists.flat().forEach((activity) => {
      activitiesById.set(activity.id, activity);
    });
    const activities = Array.from(activitiesById.values());
    if (activities.length === 0) {
      if (fetchFailures.length > 0) {
        throw new Error(`Failed to load activities from ${fetchFailures.length} folders.`);
      }
      return;
    }

    const updateFailures = [];

    for (let i = 0; i < activities.length; i += BATCH_SIZE) {
      const batch = activities.slice(i, i + BATCH_SIZE);
      const settledResults = await Promise.allSettled(
        batch.map((activity) =>
          API.updateActivityPartial(this.buildActivityFolderUpdatePayload(activity, null)),
        ),
      );
      settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          return;
        }
        updateFailures.push({
          activityId: batch[index].id,
          message: result.reason?.message || 'Unknown error',
        });
      });
    }

    if (fetchFailures.length > 0 || updateFailures.length > 0) {
      console.error('Failed to move some activities to unfoldered.', { fetchFailures, updateFailures });
      throw new Error(
        `Failed to move all activities (folder fetch failures: ${fetchFailures.length}, update failures: ${updateFailures.length}).`,
      );
    }
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
      selectedActivityIds: [],
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

  activityToggleSelected(activityId) {
    this.setState((prevState) => {
      const selectedActivityIds = prevState.selectedActivityIds.includes(activityId)
        ? prevState.selectedActivityIds.filter((id) => id !== activityId)
        : prevState.selectedActivityIds.concat(activityId);
      return { selectedActivityIds };
    });
  }

  activityToggleAll() {
    this.setState((prevState) => {
      if (prevState.selectedActivityIds.length === prevState.activities.length) {
        return { selectedActivityIds: [] };
      }
      return { selectedActivityIds: prevState.activities.map((activity) => activity.id) };
    });
  }

  activityBulkMoveModal() {
    if (this.state.selectedActivityIds.length === 0) {
      return;
    }
    this.setState({ showModalActivityBulkMove: true });
  }

  activityBulkDeleteModal() {
    if (this.state.selectedActivityIds.length === 0) {
      return;
    }
    this.setState({ showModalActivityBulkDelete: true });
  }

  async activityBulkMove(folderId) {
    const { selectedActivityIds, activities } = this.state;
    const selectedActivities = activities.filter((activity) => selectedActivityIds.includes(activity.id));
    if (selectedActivities.length === 0) {
      return;
    }

    const toastId = showLoading('Moving activities...');

    try {
      const settledResults = await Promise.allSettled(
        selectedActivities.map((activity) =>
          API.updateActivityPartial(this.buildActivityFolderUpdatePayload(activity, folderId)),
        ),
      );

      const failed = settledResults
        .map((result, index) => ({ result, activityId: selectedActivities[index].id }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ result, activityId }) => ({
          activityId,
          message: result.reason?.message || 'Unknown error',
        }));

      const failedIds = failed.map(({ activityId }) => activityId);
      const hasFailures = failedIds.length > 0;

      this.setState({
        showModalActivityBulkMove: !hasFailures,
        selectedActivityIds: failedIds,
      });

      this.loadActivities(failedIds);

      if (hasFailures) {
        const details = failed
          .map(({ activityId, message }) => `Activity ${activityId}: ${message}`)
          .join('; ');
        throw new Error(`Failed to move ${failedIds.length} activities. ${details}`);
      }
    } catch (error) {
      error.title = 'Error moving activities';
      showError(error);
    } finally {
      dismissLoading(toastId);
    }
  }

  async activityBulkDelete() {
    const { selectedActivityIds } = this.state;
    if (selectedActivityIds.length === 0) {
      return;
    }

    const toastId = showLoading('Deleting activities...');

    try {
      const settledResults = await Promise.allSettled(
        selectedActivityIds.map((id) => API.deleteActivity(id)),
      );

      const failed = settledResults
        .map((result, index) => ({ result, activityId: selectedActivityIds[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ result, activityId }) => ({
          activityId,
          message: result.reason?.message || 'Unknown error',
        }));

      const failedIds = failed.map(({ activityId }) => activityId);
      const hasFailures = failedIds.length > 0;

      this.setState({
        showModalActivityBulkDelete: !hasFailures,
        selectedActivityIds: failedIds,
      });

      this.showActivities();
      this.loadActivities(failedIds);

      if (hasFailures) {
        const details = failed
          .map(({ activityId, message }) => `Activity ${activityId}: ${message}`)
          .join('; ');
        throw new Error(`Failed to delete ${failedIds.length} activities. ${details}`);
      }
    } catch (error) {
      error.title = 'Error deleting activities';
      showError(error);
    } finally {
      dismissLoading(toastId);
    }
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

    this.reloadSelectedActivity({}, this.scrollToBottom);
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

    this.reloadSelectedActivity();
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
      .then(() => {
        this.reloadSelectedActivity();
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

    this.reloadSelectedActivity({ selectedWaypoint: null });
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

              {this.state.showBetaWarning && (
                <EnvironmentWarningBanner message={this.state.betaWarningMessage} />
              )}

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
                      selectedActivityIds={this.state.selectedActivityIds}
                      onFolderSelect={this.folderSelected}
                      onFolderCreate={this.folderCreated}
                      onFolderRename={this.folderRenameModal}
                      onFolderDelete={this.folderDeleteModal}
                      onFolderShare={this.folderShareModal}
                      onActivitySelected={this.activitySelected}
                      onActivityToggle={this.activityToggleSelected}
                      onActivityToggleAll={this.activityToggleAll}
                      onBulkMove={this.activityBulkMoveModal}
                      onBulkDelete={this.activityBulkDeleteModal}
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

              <FolderCreateModal
                show={this.state.showModalFolderCreate}
                folders={this.state.folders}
                parent={this.state.newFolderParent}
                onCancel={this.dismissModal.bind(this, 'showModalFolderCreate')}
                onSubmit={this.folderCreateSubmitted}
              />

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

              <ActivityBulkMoveModal
                show={this.state.showModalActivityBulkMove}
                folders={this.state.folders}
                count={this.state.selectedActivityIds.length}
                onCancel={this.dismissModal.bind(this, 'showModalActivityBulkMove')}
                onMove={this.activityBulkMove}
              />

              <ActivityBulkDeleteModal
                show={this.state.showModalActivityBulkDelete}
                count={this.state.selectedActivityIds.length}
                onCancel={this.dismissModal.bind(this, 'showModalActivityBulkDelete')}
                onDelete={this.activityBulkDelete}
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
