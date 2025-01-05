# @octokit/plugin-enterprise-rest/ghe-2.18

## Enterprise Administration

```js
octokit.enterpriseAdmin.addAuthorizedSshKey(authorized_key);
octokit.enterpriseAdmin.checkConfigurationStatus();
octokit.enterpriseAdmin.checkMaintenanceStatus();
octokit.enterpriseAdmin.createGlobalHook(active, config, events, name);
octokit.enterpriseAdmin.createImpersonationOAuthToken(scopes, username);
octokit.enterpriseAdmin.createOrg(admin, login, profile_name);
octokit.enterpriseAdmin.createPreReceiveEnvironment(image_url, name);
octokit.enterpriseAdmin.createPreReceiveHook(
  allow_downstream_configuration,
  enforcement,
  environment,
  name,
  script,
  script_repository
);
octokit.enterpriseAdmin.createUser(email, login);
octokit.enterpriseAdmin.deleteGlobalHook(hook_id);
octokit.enterpriseAdmin.deleteImpersonationOAuthToken(username);
octokit.enterpriseAdmin.deletePersonalAccessToken(token_id);
octokit.enterpriseAdmin.deletePreReceiveEnvironment(pre_receive_environment_id);
octokit.enterpriseAdmin.deletePreReceiveHook(pre_receive_hook_id);
octokit.enterpriseAdmin.deletePublicKey(key_ids);
octokit.enterpriseAdmin.deleteUser(username);
octokit.enterpriseAdmin.demoteSiteAdministratorToOrdinaryUser(username);
octokit.enterpriseAdmin.enableOrDisableMaintenanceMode(maintenance);
octokit.enterpriseAdmin.getGlobalHook(hook_id);
octokit.enterpriseAdmin.getLicenseInformation();
octokit.enterpriseAdmin.getPreReceiveEnvironment(pre_receive_environment_id);
octokit.enterpriseAdmin.getPreReceiveEnvironmentDownloadStatus(
  downloaded_at,
  message,
  pre_receive_environment_id,
  state
);
octokit.enterpriseAdmin.getPreReceiveHook(pre_receive_hook_id);
octokit.enterpriseAdmin.getPreReceiveHookForOrg(org, pre_receive_hook_id);
octokit.enterpriseAdmin.getPreReceiveHookForRepo(
  owner,
  pre_receive_hook_id,
  repo
);
octokit.enterpriseAdmin.getTypeStats(type);
octokit.enterpriseAdmin.listGlobalHooks(page, per_page);
octokit.enterpriseAdmin.listPersonalAccessTokens(page, per_page);
octokit.enterpriseAdmin.listPreReceiveEnvironments(page, per_page);
octokit.enterpriseAdmin.listPreReceiveHooks(page, per_page);
octokit.enterpriseAdmin.listPreReceiveHooksForOrg(org, page, per_page);
octokit.enterpriseAdmin.listPreReceiveHooksForRepo(owner, page, per_page, repo);
octokit.enterpriseAdmin.modifySettings(settings);
octokit.enterpriseAdmin.pingGlobalHook(hook_id);
octokit.enterpriseAdmin.promoteOrdinaryUserToSiteAdministrator(username);
octokit.enterpriseAdmin.queueIndexingJob(target);
octokit.enterpriseAdmin.removeAuthorizedSshKey(authorized_key);
octokit.enterpriseAdmin.removeEnforcementOverridesForPreReceiveHookForOrg(
  org,
  pre_receive_hook_id
);
octokit.enterpriseAdmin.removeEnforcementOverridesForPreReceiveHookForRepo(
  owner,
  pre_receive_hook_id,
  repo
);
octokit.enterpriseAdmin.renameOrg(login, org);
octokit.enterpriseAdmin.renameUser(login, username);
octokit.enterpriseAdmin.retrieveAuthorizedSshKeys();
octokit.enterpriseAdmin.retrieveSettings();
octokit.enterpriseAdmin.startConfigurationProcess();
octokit.enterpriseAdmin.suspendUser(reason, username);
octokit.enterpriseAdmin.syncLdapMappingForTeam(team_id);
octokit.enterpriseAdmin.syncLdapMappingForUser(username);
octokit.enterpriseAdmin.triggerPreReceiveEnvironmentDownload(
  pre_receive_environment_id
);
octokit.enterpriseAdmin.unsuspendUser(reason, username);
octokit.enterpriseAdmin.updateGlobalHook(active, config, events, hook_id);
octokit.enterpriseAdmin.updateLdapMappingForTeam(ldap_dn, team_id);
octokit.enterpriseAdmin.updateLdapMappingForUser(ldap_dn, username);
octokit.enterpriseAdmin.updatePreReceiveEnvironment(
  image_url,
  name,
  pre_receive_environment_id
);
octokit.enterpriseAdmin.updatePreReceiveHook(pre_receive_hook_id);
octokit.enterpriseAdmin.updatePreReceiveHookEnforcementForOrg(
  org,
  pre_receive_hook_id
);
octokit.enterpriseAdmin.updatePreReceiveHookEnforcementForRepo(
  owner,
  pre_receive_hook_id,
  repo
);
octokit.enterpriseAdmin.upgradeLicense(license);
octokit.enterpriseAdmin.uploadLicenseForFirstTime(license, password, settings);
```

## Others

```js
octokit.activity.checkStarringRepo(owner, repo);
octokit.activity.deleteRepoSubscription(owner, repo);
octokit.activity.deleteThreadSubscription(thread_id);
octokit.activity.getRepoSubscription(owner, repo);
octokit.activity.getThread(thread_id);
octokit.activity.getThreadSubscription(thread_id);
octokit.activity.listEventsForOrg(org, page, per_page, username);
octokit.activity.listEventsForUser(page, per_page, username);
octokit.activity.listFeeds();
octokit.activity.listNotifications(
  all,
  before,
  page,
  participating,
  per_page,
  since
);
octokit.activity.listNotificationsForRepo(
  all,
  before,
  owner,
  page,
  participating,
  per_page,
  repo,
  since
);
octokit.activity.listPublicEvents(page, per_page);
octokit.activity.listPublicEventsForOrg(org, page, per_page);
octokit.activity.listPublicEventsForRepoNetwork(owner, page, per_page, repo);
octokit.activity.listPublicEventsForUser(page, per_page, username);
octokit.activity.listReceivedEventsForUser(page, per_page, username);
octokit.activity.listReceivedPublicEventsForUser(page, per_page, username);
octokit.activity.listRepoEvents(owner, page, per_page, repo);
octokit.activity.listReposStarredByAuthenticatedUser(
  direction,
  page,
  per_page,
  sort
);
octokit.activity.listReposStarredByUser(
  direction,
  page,
  per_page,
  sort,
  username
);
octokit.activity.listReposWatchedByUser(page, per_page, username);
octokit.activity.listStargazersForRepo(owner, page, per_page, repo);
octokit.activity.listWatchedReposForAuthenticatedUser(page, per_page);
octokit.activity.listWatchersForRepo(owner, page, per_page, repo);
octokit.activity.markAsRead(last_read_at);
octokit.activity.markNotificationsAsReadForRepo(last_read_at, owner, repo);
octokit.activity.markThreadAsRead(thread_id);
octokit.activity.setRepoSubscription(ignored, owner, repo, subscribed);
octokit.activity.setThreadSubscription(ignored, thread_id);
octokit.activity.starRepo(owner, repo);
octokit.activity.unstarRepo(owner, repo);
octokit.apps.addRepoToInstallation(installation_id, repository_id);
octokit.apps.createContentAttachment(body, content_reference_id, title);
octokit.apps.createFromManifest(code);
octokit.apps.createInstallationToken(
  installation_id,
  permissions,
  repository_ids
);
octokit.apps.deleteInstallation(installation_id);
octokit.apps.findOrgInstallation(org);
octokit.apps.findRepoInstallation(owner, repo);
octokit.apps.findUserInstallation(username);
octokit.apps.getAuthenticated();
octokit.apps.getBySlug(app_slug);
octokit.apps.getInstallation(installation_id);
octokit.apps.getOrgInstallation(org);
octokit.apps.getRepoInstallation(owner, repo);
octokit.apps.getUserInstallation(username);
octokit.apps.listInstallationReposForAuthenticatedUser(
  installation_id,
  page,
  per_page
);
octokit.apps.listInstallations(page, per_page);
octokit.apps.listInstallationsForAuthenticatedUser(page, per_page);
octokit.apps.listRepos(page, per_page);
octokit.apps.removeRepoFromInstallation(installation_id, repository_id);
octokit.checks.create(
  actions,
  completed_at,
  conclusion,
  details_url,
  external_id,
  head_sha,
  name,
  output,
  owner,
  repo,
  started_at,
  status
);
octokit.checks.createSuite(head_sha, owner, repo);
octokit.checks.get(check_run_id, owner, repo);
octokit.checks.getSuite(check_suite_id, owner, repo);
octokit.checks.listAnnotations(check_run_id, owner, page, per_page, repo);
octokit.checks.listForRef(
  check_name,
  filter,
  owner,
  page,
  per_page,
  ref,
  repo,
  status
);
octokit.checks.listForSuite(
  check_name,
  check_suite_id,
  filter,
  owner,
  page,
  per_page,
  repo,
  status
);
octokit.checks.listSuitesForRef(
  app_id,
  check_name,
  owner,
  page,
  per_page,
  ref,
  repo
);
octokit.checks.rerequestSuite(check_suite_id, owner, repo);
octokit.checks.setSuitesPreferences(auto_trigger_checks, owner, repo);
octokit.checks.update(
  actions,
  check_run_id,
  completed_at,
  conclusion,
  details_url,
  external_id,
  name,
  output,
  owner,
  repo,
  started_at,
  status
);
octokit.codesOfConduct.getConductCode(key);
octokit.codesOfConduct.getForRepo(owner, repo);
octokit.codesOfConduct.listConductCodes();
octokit.emojis.get();
octokit.gists.checkIsStarred(gist_id);
octokit.gists.create(description, files, public);
octokit.gists.createComment(body, gist_id);
octokit.gists.delete(gist_id);
octokit.gists.deleteComment(comment_id, gist_id);
octokit.gists.fork(gist_id);
octokit.gists.get(gist_id);
octokit.gists.getComment(comment_id, gist_id);
octokit.gists.getRevision(gist_id, sha);
octokit.gists.list(page, per_page, since);
octokit.gists.listComments(gist_id, page, per_page);
octokit.gists.listCommits(gist_id, page, per_page);
octokit.gists.listForks(gist_id, page, per_page);
octokit.gists.listPublic(page, per_page, since);
octokit.gists.listPublicForUser(page, per_page, since, username);
octokit.gists.listStarred(page, per_page, since);
octokit.gists.star(gist_id);
octokit.gists.unstar(gist_id);
octokit.gists.update(description, files, gist_id);
octokit.gists.updateComment(body, comment_id, gist_id);
octokit.git.createBlob(content, encoding, owner, repo);
octokit.git.createCommit(
  author,
  committer,
  message,
  owner,
  parents,
  repo,
  signature,
  tree
);
octokit.git.createRef(owner, ref, repo, sha);
octokit.git.createTag(message, object, owner, repo, tag, tagger, type);
octokit.git.createTree(base_tree, owner, repo, tree);
octokit.git.deleteRef(owner, ref, repo);
octokit.git.getBlob(file_sha, owner, repo);
octokit.git.getCommit(commit_sha, owner, repo);
octokit.git.getRef(owner, ref, repo);
octokit.git.getTag(owner, repo, tag_sha);
octokit.git.getTree(owner, recursive, repo, tree_sha);
octokit.git.listRefs(namespace, owner, page, per_page, repo);
octokit.git.updateRef(force, owner, ref, repo, sha);
octokit.gitignore.getTemplate(name);
octokit.gitignore.listTemplates();
octokit.issues.addAssignees(assignees, issue_number, owner, repo);
octokit.issues.addLabels(issue_number, labels, owner, repo);
octokit.issues.checkAssignee(assignee, owner, repo);
octokit.issues.create(
  assignee,
  assignees,
  body,
  labels,
  milestone,
  owner,
  repo,
  title
);
octokit.issues.createComment(body, issue_number, owner, repo);
octokit.issues.createLabel(color, description, name, owner, repo);
octokit.issues.createMilestone(description, due_on, owner, repo, state, title);
octokit.issues.deleteComment(comment_id, owner, repo);
octokit.issues.deleteLabel(name, owner, repo);
octokit.issues.deleteMilestone(milestone_number, owner, repo);
octokit.issues.get(issue_number, owner, repo);
octokit.issues.getComment(comment_id, owner, page, per_page, repo);
octokit.issues.getEvent(event_id, owner, repo);
octokit.issues.getLabel(name, owner, repo);
octokit.issues.getMilestone(milestone_number, owner, repo);
octokit.issues.list(
  direction,
  filter,
  labels,
  page,
  per_page,
  since,
  sort,
  state
);
octokit.issues.listAssignees(owner, page, per_page, repo);
octokit.issues.listComments(issue_number, owner, page, per_page, repo, since);
octokit.issues.listCommentsForRepo(direction, owner, repo, since, sort);
octokit.issues.listEvents(issue_number, owner, page, per_page, repo);
octokit.issues.listEventsForRepo(owner, page, per_page, repo);
octokit.issues.listEventsForTimeline(issue_number, owner, page, per_page, repo);
octokit.issues.listForAuthenticatedUser(
  direction,
  filter,
  labels,
  page,
  per_page,
  since,
  sort,
  state
);
octokit.issues.listForOrg(
  direction,
  filter,
  labels,
  org,
  page,
  per_page,
  since,
  sort,
  state
);
octokit.issues.listForRepo(
  assignee,
  creator,
  direction,
  labels,
  mentioned,
  milestone,
  owner,
  page,
  per_page,
  repo,
  since,
  sort,
  state
);
octokit.issues.listLabelsForMilestone(
  milestone_number,
  owner,
  page,
  per_page,
  repo
);
octokit.issues.listLabelsForRepo(owner, page, per_page, repo);
octokit.issues.listLabelsOnIssue(issue_number, owner, page, per_page, repo);
octokit.issues.listMilestonesForRepo(
  direction,
  owner,
  page,
  per_page,
  repo,
  sort,
  state
);
octokit.issues.lock(issue_number, lock_reason, owner, repo);
octokit.issues.removeAssignees(assignees, issue_number, owner, repo);
octokit.issues.removeLabel(issue_number, name, owner, repo);
octokit.issues.removeLabels(issue_number, owner, repo);
octokit.issues.replaceLabels(issue_number, labels, owner, repo);
octokit.issues.unlock(issue_number, owner, repo);
octokit.issues.update(
  assignee,
  assignees,
  body,
  issue_number,
  labels,
  milestone,
  owner,
  repo,
  state,
  title
);
octokit.issues.updateComment(body, comment_id, owner, repo);
octokit.issues.updateLabel(color, current_name, description, name, owner, repo);
octokit.issues.updateMilestone(
  description,
  due_on,
  milestone_number,
  owner,
  repo,
  state,
  title
);
octokit.licenses.get(license);
octokit.licenses.getForRepo(owner, repo);
octokit.licenses.list();
octokit.licenses.listCommonlyUsed();
octokit.markdown.render(context, mode, text);
octokit.markdown.renderRaw(data);
octokit.meta.get();
octokit.oauthAuthorizations.checkAuthorization(access_token, client_id);
octokit.oauthAuthorizations.createAuthorization(
  client_id,
  client_secret,
  fingerprint,
  note,
  note_url,
  scopes
);
octokit.oauthAuthorizations.deleteAuthorization(authorization_id);
octokit.oauthAuthorizations.deleteGrant(grant_id);
octokit.oauthAuthorizations.getAuthorization(authorization_id);
octokit.oauthAuthorizations.getGrant(grant_id);
octokit.oauthAuthorizations.getOrCreateAuthorizationForApp(
  client_id,
  client_secret,
  fingerprint,
  note,
  note_url,
  scopes
);
octokit.oauthAuthorizations.getOrCreateAuthorizationForAppAndFingerprint(
  client_id,
  client_secret,
  fingerprint,
  note,
  note_url,
  scopes
);
octokit.oauthAuthorizations.getOrCreateAuthorizationForAppFingerprint(
  client_id,
  client_secret,
  fingerprint,
  note,
  note_url,
  scopes
);
octokit.oauthAuthorizations.listAuthorizations(page, per_page);
octokit.oauthAuthorizations.listGrants(page, per_page);
octokit.oauthAuthorizations.resetAuthorization(access_token, client_id);
octokit.oauthAuthorizations.revokeAuthorizationForApplication(
  access_token,
  client_id
);
octokit.oauthAuthorizations.revokeGrantForApplication(access_token, client_id);
octokit.oauthAuthorizations.updateAuthorization(
  add_scopes,
  authorization_id,
  fingerprint,
  note,
  note_url,
  remove_scopes,
  scopes
);
octokit.orgs.addOrUpdateMembership(org, role, username);
octokit.orgs.checkMembership(org, username);
octokit.orgs.checkPublicMembership(org, username);
octokit.orgs.concealMembership(org, username);
octokit.orgs.convertMemberToOutsideCollaborator(org, username);
octokit.orgs.createHook(active, config, events, name, org);
octokit.orgs.deleteHook(hook_id, org);
octokit.orgs.get(org);
octokit.orgs.getHook(hook_id, org);
octokit.orgs.getMembership(org, username);
octokit.orgs.getMembershipForAuthenticatedUser(org);
octokit.orgs.list(page, per_page, since);
octokit.orgs.listForAuthenticatedUser(page, per_page);
octokit.orgs.listForUser(page, per_page, username);
octokit.orgs.listHooks(org, page, per_page);
octokit.orgs.listMembers(filter, org, page, per_page, role);
octokit.orgs.listMemberships(page, per_page, state);
octokit.orgs.listOutsideCollaborators(filter, org, page, per_page);
octokit.orgs.listPublicMembers(org, page, per_page);
octokit.orgs.pingHook(hook_id, org);
octokit.orgs.publicizeMembership(org, username);
octokit.orgs.removeMember(org, username);
octokit.orgs.removeMembership(org, username);
octokit.orgs.removeOutsideCollaborator(org, username);
octokit.orgs.update(
  billing_email,
  company,
  default_repository_permission,
  description,
  email,
  has_organization_projects,
  has_repository_projects,
  location,
  members_allowed_repository_creation_type,
  members_can_create_repositories,
  name,
  org
);
octokit.orgs.updateHook(active, config, events, hook_id, org);
octokit.orgs.updateMembership(org, state);
octokit.projects.addCollaborator(permission, project_id, username);
octokit.projects.createCard(column_id, content_id, content_type, note);
octokit.projects.createColumn(name, project_id);
octokit.projects.createForAuthenticatedUser(body, name);
octokit.projects.createForOrg(body, name, org);
octokit.projects.createForRepo(body, name, owner, repo);
octokit.projects.delete(project_id);
octokit.projects.deleteCard(card_id);
octokit.projects.deleteColumn(column_id);
octokit.projects.get(page, per_page, project_id);
octokit.projects.getCard(card_id);
octokit.projects.getColumn(column_id);
octokit.projects.listCards(archived_state, column_id, page, per_page);
octokit.projects.listCollaborators(affiliation, page, per_page, project_id);
octokit.projects.listColumns(page, per_page, project_id);
octokit.projects.listForOrg(org, page, per_page, state);
octokit.projects.listForRepo(owner, page, per_page, repo, state);
octokit.projects.listForUser(page, per_page, state, username);
octokit.projects.moveCard(card_id, column_id, position);
octokit.projects.moveColumn(column_id, position);
octokit.projects.removeCollaborator(project_id, username);
octokit.projects.reviewUserPermissionLevel(project_id, username);
octokit.projects.update(
  body,
  name,
  organization_permission,
  private,
  project_id,
  state
);
octokit.projects.updateCard(archived, card_id, note);
octokit.projects.updateColumn(column_id, name);
octokit.pulls.checkIfMerged(owner, pull_number, repo);
octokit.pulls.create(
  base,
  body,
  draft,
  head,
  maintainer_can_modify,
  owner,
  repo,
  title
);
octokit.pulls.createComment(
  body,
  commit_id,
  owner,
  path,
  position,
  pull_number,
  repo
);
octokit.pulls.createCommentReply(
  body,
  commit_id,
  owner,
  path,
  position,
  pull_number,
  repo
);
octokit.pulls.createFromIssue(
  base,
  head,
  issue,
  maintainer_can_modify,
  owner,
  repo
);
octokit.pulls.createReview(
  body,
  comments,
  commit_id,
  event,
  owner,
  pull_number,
  repo
);
octokit.pulls.createReviewCommentReply(
  body,
  comment_id,
  owner,
  pull_number,
  repo
);
octokit.pulls.createReviewRequest(
  owner,
  pull_number,
  repo,
  reviewers,
  team_reviewers
);
octokit.pulls.deleteComment(comment_id, owner, repo);
octokit.pulls.deletePendingReview(owner, pull_number, repo, review_id);
octokit.pulls.deleteReviewRequest(
  owner,
  pull_number,
  repo,
  reviewers,
  team_reviewers
);
octokit.pulls.dismissReview(message, owner, pull_number, repo, review_id);
octokit.pulls.get(owner, pull_number, repo);
octokit.pulls.getComment(comment_id, owner, repo);
octokit.pulls.getCommentsForReview(
  owner,
  page,
  per_page,
  pull_number,
  repo,
  review_id
);
octokit.pulls.getReview(owner, pull_number, repo, review_id);
octokit.pulls.list(
  base,
  direction,
  head,
  owner,
  page,
  per_page,
  repo,
  sort,
  state
);
octokit.pulls.listComments(
  direction,
  owner,
  page,
  per_page,
  pull_number,
  repo,
  since,
  sort
);
octokit.pulls.listCommentsForRepo(
  direction,
  owner,
  page,
  per_page,
  repo,
  since,
  sort
);
octokit.pulls.listCommits(owner, page, per_page, pull_number, repo);
octokit.pulls.listFiles(owner, page, per_page, pull_number, repo);
octokit.pulls.listReviewRequests(owner, page, per_page, pull_number, repo);
octokit.pulls.listReviews(owner, page, per_page, pull_number, repo);
octokit.pulls.merge(
  commit_message,
  commit_title,
  merge_method,
  owner,
  pull_number,
  repo,
  sha
);
octokit.pulls.submitReview(body, event, owner, pull_number, repo, review_id);
octokit.pulls.update(
  base,
  body,
  maintainer_can_modify,
  owner,
  pull_number,
  repo,
  state,
  title
);
octokit.pulls.updateBranch(expected_head_sha, owner, pull_number, repo);
octokit.pulls.updateComment(body, comment_id, owner, repo);
octokit.pulls.updateReview(body, owner, pull_number, repo, review_id);
octokit.rateLimit.get();
octokit.reactions.createForCommitComment(comment_id, content, owner, repo);
octokit.reactions.createForIssue(content, issue_number, owner, repo);
octokit.reactions.createForIssueComment(comment_id, content, owner, repo);
octokit.reactions.createForPullRequestReviewComment(
  comment_id,
  content,
  owner,
  repo
);
octokit.reactions.createForTeamDiscussion(content, discussion_number, team_id);
octokit.reactions.createForTeamDiscussionComment(
  comment_number,
  content,
  discussion_number,
  team_id
);
octokit.reactions.delete(reaction_id);
octokit.reactions.listForCommitComment(
  comment_id,
  content,
  owner,
  page,
  per_page,
  repo
);
octokit.reactions.listForIssue(
  content,
  issue_number,
  owner,
  page,
  per_page,
  repo
);
octokit.reactions.listForIssueComment(
  comment_id,
  content,
  owner,
  page,
  per_page,
  repo
);
octokit.reactions.listForPullRequestReviewComment(
  comment_id,
  content,
  owner,
  page,
  per_page,
  repo
);
octokit.reactions.listForTeamDiscussion(
  content,
  discussion_number,
  page,
  per_page,
  team_id
);
octokit.reactions.listForTeamDiscussionComment(
  comment_number,
  content,
  discussion_number,
  page,
  per_page,
  team_id
);
octokit.repos.acceptInvitation(invitation_id);
octokit.repos.addCollaborator(owner, permission, repo, username);
octokit.repos.addDeployKey(key, owner, read_only, repo, title);
octokit.repos.addProtectedBranchAdminEnforcement(branch, owner, repo);
octokit.repos.addProtectedBranchRequiredSignatures(branch, owner, repo);
octokit.repos.addProtectedBranchRequiredStatusChecksContexts(
  branch,
  contexts,
  owner,
  repo
);
octokit.repos.addProtectedBranchTeamRestrictions(branch, owner, repo, teams);
octokit.repos.addProtectedBranchUserRestrictions(branch, owner, repo, users);
octokit.repos.checkCollaborator(owner, repo, username);
octokit.repos.compareCommits(base, head, owner, repo);
octokit.repos.createCommitComment(
  body,
  commit_sha,
  line,
  owner,
  path,
  position,
  repo
);
octokit.repos.createDeployment(
  auto_merge,
  description,
  environment,
  owner,
  payload,
  production_environment,
  ref,
  repo,
  required_contexts,
  task,
  transient_environment
);
octokit.repos.createDeploymentStatus(
  auto_inactive,
  deployment_id,
  description,
  environment,
  environment_url,
  log_url,
  owner,
  repo,
  state,
  target_url
);
octokit.repos.createFile(
  author,
  branch,
  committer,
  content,
  message,
  owner,
  path,
  repo,
  sha
);
octokit.repos.createForAuthenticatedUser(
  allow_merge_commit,
  allow_rebase_merge,
  allow_squash_merge,
  auto_init,
  description,
  gitignore_template,
  has_issues,
  has_projects,
  has_wiki,
  homepage,
  is_template,
  license_template,
  name,
  private,
  team_id
);
octokit.repos.createFork(organization, owner, repo);
octokit.repos.createHook(active, config, events, name, owner, repo);
octokit.repos.createInOrg(
  allow_merge_commit,
  allow_rebase_merge,
  allow_squash_merge,
  auto_init,
  description,
  gitignore_template,
  has_issues,
  has_projects,
  has_wiki,
  homepage,
  is_template,
  license_template,
  name,
  org,
  private,
  team_id
);
octokit.repos.createOrUpdateFile(
  author,
  branch,
  committer,
  content,
  message,
  owner,
  path,
  repo,
  sha
);
octokit.repos.createRelease(
  body,
  draft,
  name,
  owner,
  prerelease,
  repo,
  tag_name,
  target_commitish
);
octokit.repos.createStatus(
  context,
  description,
  owner,
  repo,
  sha,
  state,
  target_url
);
octokit.repos.createUsingTemplate(
  description,
  name,
  owner,
  private,
  template_owner,
  template_repo
);
octokit.repos.declineInvitation(invitation_id);
octokit.repos.delete(owner, repo);
octokit.repos.deleteCommitComment(comment_id, owner, repo);
octokit.repos.deleteDownload(download_id, owner, repo);
octokit.repos.deleteFile(
  author,
  branch,
  committer,
  message,
  owner,
  path,
  repo,
  sha
);
octokit.repos.deleteHook(hook_id, owner, repo);
octokit.repos.deleteInvitation(invitation_id, owner, repo);
octokit.repos.deleteRelease(owner, release_id, repo);
octokit.repos.deleteReleaseAsset(asset_id, owner, repo);
octokit.repos.disablePagesSite(owner, repo);
octokit.repos.disableVulnerabilityAlerts(owner, repo);
octokit.repos.enablePagesSite(owner, repo, source);
octokit.repos.enableVulnerabilityAlerts(owner, repo);
octokit.repos.get(owner, repo);
octokit.repos.getArchiveLink(archive_format, owner, ref, repo);
octokit.repos.getBranch(branch, owner, repo);
octokit.repos.getBranchProtection(branch, owner, repo);
octokit.repos.getCodeFrequencyStats(owner, repo);
octokit.repos.getCollaboratorPermissionLevel(owner, repo, username);
octokit.repos.getCombinedStatusForRef(owner, ref, repo);
octokit.repos.getCommit(owner, ref, repo);
octokit.repos.getCommitActivityStats(owner, repo);
octokit.repos.getCommitComment(comment_id, owner, repo);
octokit.repos.getCommitRefSha(owner, ref, repo);
octokit.repos.getContents(owner, path, ref, repo);
octokit.repos.getContributorsStats(owner, repo);
octokit.repos.getDeployKey(key_id, owner, repo);
octokit.repos.getDeployment(deployment_id, owner, repo);
octokit.repos.getDeploymentStatus(deployment_id, owner, repo, status_id);
octokit.repos.getDownload(download_id, owner, repo);
octokit.repos.getHook(hook_id, owner, repo);
octokit.repos.getLatestPagesBuild(owner, repo);
octokit.repos.getLatestRelease(owner, repo);
octokit.repos.getPages(owner, repo);
octokit.repos.getPagesBuild(build_id, owner, repo);
octokit.repos.getParticipationStats(owner, repo);
octokit.repos.getProtectedBranchAdminEnforcement(branch, owner, repo);
octokit.repos.getProtectedBranchPullRequestReviewEnforcement(
  branch,
  owner,
  repo
);
octokit.repos.getProtectedBranchRequiredSignatures(branch, owner, repo);
octokit.repos.getProtectedBranchRequiredStatusChecks(branch, owner, repo);
octokit.repos.getProtectedBranchRestrictions(branch, owner, repo);
octokit.repos.getPunchCardStats(owner, repo);
octokit.repos.getReadme(owner, ref, repo);
octokit.repos.getRelease(owner, release_id, repo);
octokit.repos.getReleaseAsset(asset_id, owner, repo);
octokit.repos.getReleaseByTag(owner, repo, tag);
octokit.repos.getTeamsWithAccessToProtectedBranch(branch, owner, repo);
octokit.repos.getUsersWithAccessToProtectedBranch(branch, owner, repo);
octokit.repos.list(
  affiliation,
  direction,
  page,
  per_page,
  sort,
  type,
  visibility
);
octokit.repos.listAssetsForRelease(owner, page, per_page, release_id, repo);
octokit.repos.listBranches(owner, page, per_page, protected, repo);
octokit.repos.listBranchesForHeadCommit(commit_sha, owner, repo);
octokit.repos.listCollaborators(affiliation, owner, page, per_page, repo);
octokit.repos.listCommentsForCommit(commit_sha, owner, page, per_page, repo);
octokit.repos.listCommitComments(owner, page, per_page, repo);
octokit.repos.listCommits(
  author,
  owner,
  page,
  path,
  per_page,
  repo,
  sha,
  since,
  until
);
octokit.repos.listContributors(anon, owner, page, per_page, repo);
octokit.repos.listDeployKeys(owner, page, per_page, repo);
octokit.repos.listDeploymentStatuses(
  deployment_id,
  owner,
  page,
  per_page,
  repo
);
octokit.repos.listDeployments(
  environment,
  owner,
  page,
  per_page,
  ref,
  repo,
  sha,
  task
);
octokit.repos.listDownloads(owner, page, per_page, repo);
octokit.repos.listForOrg(direction, org, page, per_page, sort, type);
octokit.repos.listForUser(direction, page, per_page, sort, type, username);
octokit.repos.listForks(owner, page, per_page, repo, sort);
octokit.repos.listHooks(owner, page, per_page, repo);
octokit.repos.listInvitations(owner, page, per_page, repo);
octokit.repos.listInvitationsForAuthenticatedUser(page, per_page);
octokit.repos.listLanguages(owner, repo);
octokit.repos.listPagesBuilds(owner, page, per_page, repo);
octokit.repos.listProtectedBranchRequiredStatusChecksContexts(
  branch,
  owner,
  repo
);
octokit.repos.listProtectedBranchTeamRestrictions(branch, owner, repo);
octokit.repos.listProtectedBranchUserRestrictions(branch, owner, repo);
octokit.repos.listPublic(page, per_page, since, visibility);
octokit.repos.listPullRequestsAssociatedWithCommit(
  commit_sha,
  owner,
  page,
  per_page,
  repo
);
octokit.repos.listReleases(owner, page, per_page, repo);
octokit.repos.listStatusesForRef(owner, page, per_page, ref, repo);
octokit.repos.listTags(owner, page, per_page, repo);
octokit.repos.listTeams(owner, page, per_page, repo);
octokit.repos.listTeamsWithAccessToProtectedBranch(branch, owner, repo);
octokit.repos.listTopics(owner, repo);
octokit.repos.listUsersWithAccessToProtectedBranch(branch, owner, repo);
octokit.repos.merge(base, commit_message, head, owner, repo);
octokit.repos.pingHook(hook_id, owner, repo);
octokit.repos.removeBranchProtection(branch, owner, repo);
octokit.repos.removeCollaborator(owner, repo, username);
octokit.repos.removeDeployKey(key_id, owner, repo);
octokit.repos.removeProtectedBranchAdminEnforcement(branch, owner, repo);
octokit.repos.removeProtectedBranchPullRequestReviewEnforcement(
  branch,
  owner,
  repo
);
octokit.repos.removeProtectedBranchRequiredSignatures(branch, owner, repo);
octokit.repos.removeProtectedBranchRequiredStatusChecks(branch, owner, repo);
octokit.repos.removeProtectedBranchRequiredStatusChecksContexts(
  branch,
  contexts,
  owner,
  repo
);
octokit.repos.removeProtectedBranchRestrictions(branch, owner, repo);
octokit.repos.removeProtectedBranchTeamRestrictions(branch, owner, repo, teams);
octokit.repos.removeProtectedBranchUserRestrictions(branch, owner, repo, users);
octokit.repos.replaceProtectedBranchRequiredStatusChecksContexts(
  branch,
  contexts,
  owner,
  repo
);
octokit.repos.replaceProtectedBranchTeamRestrictions(
  branch,
  owner,
  repo,
  teams
);
octokit.repos.replaceProtectedBranchUserRestrictions(
  branch,
  owner,
  repo,
  users
);
octokit.repos.replaceTopics(names, owner, repo);
octokit.repos.requestPageBuild(owner, repo);
octokit.repos.testPushHook(hook_id, owner, repo);
octokit.repos.transfer(new_owner, owner, repo, team_ids);
octokit.repos.update(
  allow_merge_commit,
  allow_rebase_merge,
  allow_squash_merge,
  anonymous_access_enabled,
  archived,
  default_branch,
  description,
  has_issues,
  has_projects,
  has_wiki,
  homepage,
  is_template,
  name,
  owner,
  private,
  repo
);
octokit.repos.updateBranchProtection(
  branch,
  enforce_admins,
  owner,
  repo,
  required_pull_request_reviews,
  required_status_checks,
  restrictions
);
octokit.repos.updateCommitComment(body, comment_id, owner, repo);
octokit.repos.updateFile(
  author,
  branch,
  committer,
  content,
  message,
  owner,
  path,
  repo,
  sha
);
octokit.repos.updateHook(
  active,
  add_events,
  config,
  events,
  hook_id,
  owner,
  remove_events,
  repo
);
octokit.repos.updateInformationAboutPagesSite(owner, repo, source);
octokit.repos.updateInvitation(invitation_id, owner, permissions, repo);
octokit.repos.updateProtectedBranchPullRequestReviewEnforcement(
  branch,
  dismiss_stale_reviews,
  dismissal_restrictions,
  owner,
  repo,
  require_code_owner_reviews,
  required_approving_review_count
);
octokit.repos.updateProtectedBranchRequiredStatusChecks(
  branch,
  contexts,
  owner,
  repo,
  strict
);
octokit.repos.updateRelease(
  body,
  draft,
  name,
  owner,
  prerelease,
  release_id,
  repo,
  tag_name,
  target_commitish
);
octokit.repos.updateReleaseAsset(asset_id, label, name, owner, repo);
octokit.repos.uploadReleaseAsset(file, headers, label, name, url);
octokit.search.code(order, page, per_page, q, sort);
octokit.search.commits(order, page, per_page, q, sort);
octokit.search.issues(order, page, per_page, q, sort);
octokit.search.issuesAndPullRequests(order, page, per_page, q, sort);
octokit.search.labels(order, q, repository_id, sort);
octokit.search.repos(order, page, per_page, q, sort);
octokit.search.topics(q);
octokit.search.users(order, page, per_page, q, sort);
octokit.teams.addMember(team_id, username);
octokit.teams.addOrUpdateMembership(role, team_id, username);
octokit.teams.addOrUpdateProject(permission, project_id, team_id);
octokit.teams.addOrUpdateRepo(owner, permission, repo, team_id);
octokit.teams.checkManagesRepo(owner, repo, team_id);
octokit.teams.create(
  description,
  ldap_dn,
  maintainers,
  name,
  org,
  parent_team_id,
  permission,
  privacy,
  repo_names
);
octokit.teams.createDiscussion(body, private, team_id, title);
octokit.teams.createDiscussionComment(body, discussion_number, team_id);
octokit.teams.delete(team_id);
octokit.teams.deleteDiscussion(discussion_number, team_id);
octokit.teams.deleteDiscussionComment(
  comment_number,
  discussion_number,
  team_id
);
octokit.teams.get(team_id);
octokit.teams.getByName(org, team_slug);
octokit.teams.getDiscussion(discussion_number, team_id);
octokit.teams.getDiscussionComment(comment_number, discussion_number, team_id);
octokit.teams.getMember(team_id, username);
octokit.teams.getMembership(team_id, username);
octokit.teams.list(org, page, per_page);
octokit.teams.listChild(page, per_page, team_id);
octokit.teams.listDiscussionComments(
  direction,
  discussion_number,
  page,
  per_page,
  team_id
);
octokit.teams.listDiscussions(direction, page, per_page, team_id);
octokit.teams.listForAuthenticatedUser(page, per_page);
octokit.teams.listMembers(page, per_page, role, team_id);
octokit.teams.listProjects(page, per_page, team_id);
octokit.teams.listRepos(page, per_page, team_id);
octokit.teams.removeMember(team_id, username);
octokit.teams.removeMembership(team_id, username);
octokit.teams.removeProject(project_id, team_id);
octokit.teams.removeRepo(owner, repo, team_id);
octokit.teams.reviewProject(project_id, team_id);
octokit.teams.update(
  description,
  name,
  parent_team_id,
  permission,
  privacy,
  team_id
);
octokit.teams.updateDiscussion(body, discussion_number, team_id, title);
octokit.teams.updateDiscussionComment(
  body,
  comment_number,
  discussion_number,
  team_id
);
octokit.users.addEmails(emails);
octokit.users.checkFollowing(username);
octokit.users.checkFollowingForUser(target_user, username);
octokit.users.createGpgKey(armored_public_key);
octokit.users.createPublicKey(key, title);
octokit.users.deleteEmails(emails);
octokit.users.deleteGpgKey(gpg_key_id);
octokit.users.deletePublicKey(key_id);
octokit.users.follow(username);
octokit.users.getAuthenticated();
octokit.users.getByUsername(username);
octokit.users.getContextForUser(subject_id, subject_type, username);
octokit.users.getGpgKey(gpg_key_id);
octokit.users.getPublicKey(key_id);
octokit.users.list(page, per_page, since);
octokit.users.listEmails(page, per_page);
octokit.users.listFollowersForAuthenticatedUser(page, per_page);
octokit.users.listFollowersForUser(page, per_page, username);
octokit.users.listFollowingForAuthenticatedUser(page, per_page);
octokit.users.listFollowingForUser(page, per_page, username);
octokit.users.listGpgKeys(page, per_page);
octokit.users.listGpgKeysForUser(page, per_page, username);
octokit.users.listPublicEmails(page, per_page);
octokit.users.listPublicKeys(page, per_page);
octokit.users.listPublicKeysForUser(page, per_page, username);
octokit.users.unfollow(username);
octokit.users.updateAuthenticated(
  bio,
  blog,
  company,
  email,
  hireable,
  location,
  name
);
```
