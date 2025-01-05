module.exports = [
  /**
   * .repos.getCommitRefSha() is a separate endpoint. It has meanwhile been
   * removed from https://developer.github.com/v3/repos/commits/. The workaround
   * can be removed with the next breaking version of @octokit/rest
   */
  {
    name: "Get a commit sha",
    isDeprecated: true,
    scope: "repos",
    id: "getCommitRefSha",
    deprecated:
      '"Get the SHA-1 of a commit reference" will be removed. Use "Get a single commit" with media type format set to "sha" instead.',
    method: "GET",
    url: "/repos/{owner}/{repo}/commits/{ref}",
    previews: [],
    description:
      "**Note:** To access this endpoint, you must provide a custom [media type](https://developer.github.com/v3/media) in the `Accept` header:\n```\napplication/vnd.github.VERSION.sha\n```\nReturns the SHA-1 of the commit reference. You must have `read` access for the repository to get the SHA-1 of a commit reference. You can use this endpoint to check if a remote reference's SHA-1 is the same as your local reference's SHA-1 by providing the local SHA-1 reference as the ETag.",
    documentationUrl:
      "https://developer.github.com/v3/repos/commits/#get-a-single-commit",
    headers: [
      {
        name: "accept",
        value: "application/vnd.github.v3.sha"
      }
    ],
    parameters: [
      {
        name: "owner",
        description: "owner parameter",
        in: "PATH",
        type: "string",
        required: true
      },
      {
        name: "ref",
        description: "ref parameter",
        in: "PATH",
        type: "string",
        required: true
      },
      {
        name: "repo",
        description: "repo parameter",
        in: "PATH",
        type: "string",
        required: true
      }
    ],
    responses: []
  },

  /**
   * `.git.listRefs` is currently not included in the OpenAPI Spec at https://github.com/octokit/routes
   * because the path `/repos/{owner}/{repo}/git/refs/{namespace}` is conflicting with
   * `/repos/{owner}/{repo}/git/refs/{ref}` from `.git.getRef`.
   *
   * Two new endpoints are being created to remove the path conflict (2019-10-01)
   */
  {
    name: "Get all references",
    scope: "git",
    id: "listRefs",
    method: "GET",
    url: "/repos/{owner}/{repo}/git/refs/{namespace}",
    previews: [],
    description:
      "Returns an array of all the references from your Git database, including notes and stashes if they exist on the server. Anything in the namespace is returned, not just `heads` and `tags`. If there are no references to list, a `404` is returned.",
    documentationUrl:
      "https://developer.github.com/v3/git/refs/#get-all-references",
    headers: [],
    parameters: [
      {
        name: "owner",
        description: "owner parameter",
        in: "PATH",
        type: "string",
        required: true
      },
      {
        name: "repo",
        description: "repo parameter",
        in: "PATH",
        type: "string",
        required: true
      },
      {
        name: "namespace",
        description: "namespace parameter",
        in: "PATH",
        type: "string"
      },
      {
        name: "per_page",
        description: "Results per page (max 100)",
        in: "QUERY",
        type: "integer"
      },
      {
        name: "page",
        description: "Page number of the results to fetch.",
        in: "QUERY",
        type: "integer"
      }
    ],
    responses: []
  },

  /**
   * This overrides the specification from https://github.com/octokit/routes.
   * The path has recently been changed from
   *
   *     /repos/{owner}/{repo}/labels/{current_name}
   *
   * to
   *
   *     /repos/{owner}/{repo}/labels/{name}
   *
   * In order to remove a conflict with `/repos/{owner}/{repo}/labels/{name}` from `issues.getLabel`.
   *
   * This cannot be easily addressed with a migration, because the parameter renames are conflicting
   *
   *     current_name -> name (in path)
   *     name -> new_name (in body)
   *
   * This workaround should be removed with the next breaking version of `@octokit/rest`
   */
  {
    name: "Update a label",
    scope: "issues",
    id: "updateLabel",
    method: "PATCH",
    url: "/repos/{owner}/{repo}/labels/{current_name}",
    previews: [],
    description: "",
    documentationUrl:
      "https://developer.github.com/v3/issues/labels/#update-a-label",
    headers: [],
    parameters: [
      {
        name: "owner",
        description: "owner parameter",
        in: "PATH",
        type: "string",
        required: true
      },
      {
        name: "repo",
        description: "repo parameter",
        in: "PATH",
        type: "string",
        required: true
      },
      {
        name: "current_name",
        description: "current_name parameter",
        in: "PATH",
        type: "string",
        required: true
      },
      {
        name: "color",
        description:
          "The [hexadecimal color code](http://www.color-hex.com/) for the label, without the leading `#`.",
        in: "BODY",
        type: "string"
      },
      {
        name: "name",
        description: "",
        type: "string",
        in: "BODY"
      },
      {
        name: "description",
        description: "A short description of the label.",
        type: "string",
        in: "BODY"
      }
    ],
    responses: [
      {
        code: 201,
        description: "response",
        examples: [
          {
            data: JSON.stringify({
              id: 208045946,
              node_id: "MDU6TGFiZWwyMDgwNDU5NDY=",
              url:
                "https://api.github.com/repos/octocat/Hello-World/labels/bug%20:bug:",
              name: "bug :bug:",
              description: "Small bug fix required",
              color: "b01f26",
              default: true
            })
          }
        ]
      }
    ]
  },

  /**
   * The `.pulls.createFromIssue()` method is deprecated altogether and should no longer be used.
   * It will be removed with the next breaking verion of `@octokit/rest`
   */
  {
    name: "Create from issue",
    isDeprecated: true,
    scope: "pulls",
    id: "createFromIssue",
    method: "POST",
    url: "/repos/:owner/:repo/pulls",
    previews: [],
    description: "",
    documentationUrl:
      "https://developer.github.com/v3/pulls/#create-a-pull-request",
    headers: [],
    parameters: [
      {
        name: "owner",
        description: "owner parameter",
        in: "PATH",
        type: "string",
        required: true
      },
      {
        name: "repo",
        description: "repo parameter",
        in: "PATH",
        type: "string",
        required: true
      },
      {
        name: "base",
        descripion: "",
        in: "BODY",
        required: true,
        type: "string"
      },
      {
        name: "head",
        descripion: "",
        in: "BODY",
        required: true,
        type: "string"
      },
      {
        name: "issue",
        descripion: "",
        in: "BODY",
        required: true,
        type: "integer"
      },
      {
        name: "maintainer_can_modify",
        descripion: "",
        in: "BODY",
        type: "boolean"
      },
      {
        name: "owner",
        descripion: "",
        in: "BODY",
        required: true,
        type: "string"
      },
      {
        name: "repo",
        descripion: "",
        in: "BODY",
        required: true,
        type: "string"
      }
    ],
    responses: [
      {
        code: 201,
        description: "response",
        examples: [
          {
            data:
              '{"url":"https://api.github.com/repos/octocat/Hello-World/pulls/1347","id":1,"node_id":"MDExOlB1bGxSZXF1ZXN0MQ==","html_url":"https://github.com/octocat/Hello-World/pull/1347","diff_url":"https://github.com/octocat/Hello-World/pull/1347.diff","patch_url":"https://github.com/octocat/Hello-World/pull/1347.patch","issue_url":"https://api.github.com/repos/octocat/Hello-World/issues/1347","commits_url":"https://api.github.com/repos/octocat/Hello-World/pulls/1347/commits","review_comments_url":"https://api.github.com/repos/octocat/Hello-World/pulls/1347/comments","review_comment_url":"https://api.github.com/repos/octocat/Hello-World/pulls/comments{/number}","comments_url":"https://api.github.com/repos/octocat/Hello-World/issues/1347/comments","statuses_url":"https://api.github.com/repos/octocat/Hello-World/statuses/6dcb09b5b57875f334f61aebed695e2e4193db5e","number":1347,"state":"open","locked":true,"title":"Amazing new feature","user":{"login":"octocat","id":1,"node_id":"MDQ6VXNlcjE=","avatar_url":"https://github.com/images/error/octocat_happy.gif","gravatar_id":"","url":"https://api.github.com/users/octocat","html_url":"https://github.com/octocat","followers_url":"https://api.github.com/users/octocat/followers","following_url":"https://api.github.com/users/octocat/following{/other_user}","gists_url":"https://api.github.com/users/octocat/gists{/gist_id}","starred_url":"https://api.github.com/users/octocat/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/octocat/subscriptions","organizations_url":"https://api.github.com/users/octocat/orgs","repos_url":"https://api.github.com/users/octocat/repos","events_url":"https://api.github.com/users/octocat/events{/privacy}","received_events_url":"https://api.github.com/users/octocat/received_events","type":"User","site_admin":false},"body":"Please pull these awesome changes in!","labels":[{"id":208045946,"node_id":"MDU6TGFiZWwyMDgwNDU5NDY=","url":"https://api.github.com/repos/octocat/Hello-World/labels/bug","name":"bug","description":"Something isn\'t working","color":"f29513","default":true}],"milestone":{"url":"https://api.github.com/repos/octocat/Hello-World/milestones/1","html_url":"https://github.com/octocat/Hello-World/milestones/v1.0","labels_url":"https://api.github.com/repos/octocat/Hello-World/milestones/1/labels","id":1002604,"node_id":"MDk6TWlsZXN0b25lMTAwMjYwNA==","number":1,"state":"open","title":"v1.0","description":"Tracking milestone for version 1.0","creator":{"login":"octocat","id":1,"node_id":"MDQ6VXNlcjE=","avatar_url":"https://github.com/images/error/octocat_happy.gif","gravatar_id":"","url":"https://api.github.com/users/octocat","html_url":"https://github.com/octocat","followers_url":"https://api.github.com/users/octocat/followers","following_url":"https://api.github.com/users/octocat/following{/other_user}","gists_url":"https://api.github.com/users/octocat/gists{/gist_id}","starred_url":"https://api.github.com/users/octocat/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/octocat/subscriptions","organizations_url":"https://api.github.com/users/octocat/orgs","repos_url":"https://api.github.com/users/octocat/repos","events_url":"https://api.github.com/users/octocat/events{/privacy}","received_events_url":"https://api.github.com/users/octocat/received_events","type":"User","site_admin":false},"open_issues":4,"closed_issues":8,"created_at":"2011-04-10T20:09:31Z","updated_at":"2014-03-03T18:58:10Z","closed_at":"2013-02-12T13:22:01Z","due_on":"2012-10-09T23:39:01Z"},"active_lock_reason":"too heated","created_at":"2011-01-26T19:01:12Z","updated_at":"2011-01-26T19:01:12Z","closed_at":"2011-01-26T19:01:12Z","merged_at":"2011-01-26T19:01:12Z","merge_commit_sha":"e5bd3914e2e596debea16f433f57875b5b90bcd6","assignee":{"login":"octocat","id":1,"node_id":"MDQ6VXNlcjE=","avatar_url":"https://github.com/images/error/octocat_happy.gif","gravatar_id":"","url":"https://api.github.com/users/octocat","html_url":"https://github.com/octocat","followers_url":"https://api.github.com/users/octocat/followers","following_url":"https://api.github.com/users/octocat/following{/other_user}","gists_url":"https://api.github.com/users/octocat/gists{/gist_id}","starred_url":"https://api.github.com/users/octocat/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/octocat/subscriptions","organizations_url":"https://api.github.com/users/octocat/orgs","repos_url":"https://api.github.com/users/octocat/repos","events_url":"https://api.github.com/users/octocat/events{/privacy}","received_events_url":"https://api.github.com/users/octocat/received_events","type":"User","site_admin":false},"assignees":[{"login":"octocat","id":1,"node_id":"MDQ6VXNlcjE=","avatar_url":"https://github.com/images/error/octocat_happy.gif","gravatar_id":"","url":"https://api.github.com/users/octocat","html_url":"https://github.com/octocat","followers_url":"https://api.github.com/users/octocat/followers","following_url":"https://api.github.com/users/octocat/following{/other_user}","gists_url":"https://api.github.com/users/octocat/gists{/gist_id}","starred_url":"https://api.github.com/users/octocat/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/octocat/subscriptions","organizations_url":"https://api.github.com/users/octocat/orgs","repos_url":"https://api.github.com/users/octocat/repos","events_url":"https://api.github.com/users/octocat/events{/privacy}","received_events_url":"https://api.github.com/users/octocat/received_events","type":"User","site_admin":false},{"login":"hubot","id":1,"node_id":"MDQ6VXNlcjE=","avatar_url":"https://github.com/images/error/hubot_happy.gif","gravatar_id":"","url":"https://api.github.com/users/hubot","html_url":"https://github.com/hubot","followers_url":"https://api.github.com/users/hubot/followers","following_url":"https://api.github.com/users/hubot/following{/other_user}","gists_url":"https://api.github.com/users/hubot/gists{/gist_id}","starred_url":"https://api.github.com/users/hubot/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/hubot/subscriptions","organizations_url":"https://api.github.com/users/hubot/orgs","repos_url":"https://api.github.com/users/hubot/repos","events_url":"https://api.github.com/users/hubot/events{/privacy}","received_events_url":"https://api.github.com/users/hubot/received_events","type":"User","site_admin":true}],"requested_reviewers":[{"login":"other_user","id":1,"node_id":"MDQ6VXNlcjE=","avatar_url":"https://github.com/images/error/other_user_happy.gif","gravatar_id":"","url":"https://api.github.com/users/other_user","html_url":"https://github.com/other_user","followers_url":"https://api.github.com/users/other_user/followers","following_url":"https://api.github.com/users/other_user/following{/other_user}","gists_url":"https://api.github.com/users/other_user/gists{/gist_id}","starred_url":"https://api.github.com/users/other_user/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/other_user/subscriptions","organizations_url":"https://api.github.com/users/other_user/orgs","repos_url":"https://api.github.com/users/other_user/repos","events_url":"https://api.github.com/users/other_user/events{/privacy}","received_events_url":"https://api.github.com/users/other_user/received_events","type":"User","site_admin":false}],"requested_teams":[{"id":1,"node_id":"MDQ6VGVhbTE=","url":"https://api.github.com/teams/1","html_url":"https://api.github.com/teams/justice-league","name":"Justice League","slug":"justice-league","description":"A great team.","privacy":"closed","permission":"admin","members_url":"https://api.github.com/teams/1/members{/member}","repositories_url":"https://api.github.com/teams/1/repos","parent":null}],"head":{"label":"octocat:new-topic","ref":"new-topic","sha":"6dcb09b5b57875f334f61aebed695e2e4193db5e","user":{"login":"octocat","id":1,"node_id":"MDQ6VXNlcjE=","avatar_url":"https://github.com/images/error/octocat_happy.gif","gravatar_id":"","url":"https://api.github.com/users/octocat","html_url":"https://github.com/octocat","followers_url":"https://api.github.com/users/octocat/followers","following_url":"https://api.github.com/users/octocat/following{/other_user}","gists_url":"https://api.github.com/users/octocat/gists{/gist_id}","starred_url":"https://api.github.com/users/octocat/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/octocat/subscriptions","organizations_url":"https://api.github.com/users/octocat/orgs","repos_url":"https://api.github.com/users/octocat/repos","events_url":"https://api.github.com/users/octocat/events{/privacy}","received_events_url":"https://api.github.com/users/octocat/received_events","type":"User","site_admin":false},"repo":{"id":1296269,"node_id":"MDEwOlJlcG9zaXRvcnkxMjk2MjY5","name":"Hello-World","full_name":"octocat/Hello-World","owner":{"login":"octocat","id":1,"node_id":"MDQ6VXNlcjE=","avatar_url":"https://github.com/images/error/octocat_happy.gif","gravatar_id":"","url":"https://api.github.com/users/octocat","html_url":"https://github.com/octocat","followers_url":"https://api.github.com/users/octocat/followers","following_url":"https://api.github.com/users/octocat/following{/other_user}","gists_url":"https://api.github.com/users/octocat/gists{/gist_id}","starred_url":"https://api.github.com/users/octocat/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/octocat/subscriptions","organizations_url":"https://api.github.com/users/octocat/orgs","repos_url":"https://api.github.com/users/octocat/repos","events_url":"https://api.github.com/users/octocat/events{/privacy}","received_events_url":"https://api.github.com/users/octocat/received_events","type":"User","site_admin":false},"private":false,"html_url":"https://github.com/octocat/Hello-World","description":"This your first repo!","fork":false,"url":"https://api.github.com/repos/octocat/Hello-World","archive_url":"http://api.github.com/repos/octocat/Hello-World/{archive_format}{/ref}","assignees_url":"http://api.github.com/repos/octocat/Hello-World/assignees{/user}","blobs_url":"http://api.github.com/repos/octocat/Hello-World/git/blobs{/sha}","branches_url":"http://api.github.com/repos/octocat/Hello-World/branches{/branch}","collaborators_url":"http://api.github.com/repos/octocat/Hello-World/collaborators{/collaborator}","comments_url":"http://api.github.com/repos/octocat/Hello-World/comments{/number}","commits_url":"http://api.github.com/repos/octocat/Hello-World/commits{/sha}","compare_url":"http://api.github.com/repos/octocat/Hello-World/compare/{base}...{head}","contents_url":"http://api.github.com/repos/octocat/Hello-World/contents/{+path}","contributors_url":"http://api.github.com/repos/octocat/Hello-World/contributors","deployments_url":"http://api.github.com/repos/octocat/Hello-World/deployments","downloads_url":"http://api.github.com/repos/octocat/Hello-World/downloads","events_url":"http://api.github.com/repos/octocat/Hello-World/events","forks_url":"http://api.github.com/repos/octocat/Hello-World/forks","git_commits_url":"http://api.github.com/repos/octocat/Hello-World/git/commits{/sha}","git_refs_url":"http://api.github.com/repos/octocat/Hello-World/git/refs{/sha}","git_tags_url":"http://api.github.com/repos/octocat/Hello-World/git/tags{/sha}","git_url":"git:github.com/octocat/Hello-World.git","issue_comment_url":"http://api.github.com/repos/octocat/Hello-World/issues/comments{/number}","issue_events_url":"http://api.github.com/repos/octocat/Hello-World/issues/events{/number}","issues_url":"http://api.github.com/repos/octocat/Hello-World/issues{/number}","keys_url":"http://api.github.com/repos/octocat/Hello-World/keys{/key_id}","labels_url":"http://api.github.com/repos/octocat/Hello-World/labels{/name}","languages_url":"http://api.github.com/repos/octocat/Hello-World/languages","merges_url":"http://api.github.com/repos/octocat/Hello-World/merges","milestones_url":"http://api.github.com/repos/octocat/Hello-World/milestones{/number}","notifications_url":"http://api.github.com/repos/octocat/Hello-World/notifications{?since,all,participating}","pulls_url":"http://api.github.com/repos/octocat/Hello-World/pulls{/number}","releases_url":"http://api.github.com/repos/octocat/Hello-World/releases{/id}","ssh_url":"git@github.com:octocat/Hello-World.git","stargazers_url":"http://api.github.com/repos/octocat/Hello-World/stargazers","statuses_url":"http://api.github.com/repos/octocat/Hello-World/statuses/{sha}","subscribers_url":"http://api.github.com/repos/octocat/Hello-World/subscribers","subscription_url":"http://api.github.com/repos/octocat/Hello-World/subscription","tags_url":"http://api.github.com/repos/octocat/Hello-World/tags","teams_url":"http://api.github.com/repos/octocat/Hello-World/teams","trees_url":"http://api.github.com/repos/octocat/Hello-World/git/trees{/sha}","clone_url":"https://github.com/octocat/Hello-World.git","mirror_url":"git:git.example.com/octocat/Hello-World","hooks_url":"http://api.github.com/repos/octocat/Hello-World/hooks","svn_url":"https://svn.github.com/octocat/Hello-World","homepage":"https://github.com","language":null,"forks_count":9,"stargazers_count":80,"watchers_count":80,"size":108,"default_branch":"master","open_issues_count":0,"is_template":true,"topics":["octocat","atom","electron","api"],"has_issues":true,"has_projects":true,"has_wiki":true,"has_pages":false,"has_downloads":true,"archived":false,"disabled":false,"pushed_at":"2011-01-26T19:06:43Z","created_at":"2011-01-26T19:01:12Z","updated_at":"2011-01-26T19:14:43Z","permissions":{"admin":false,"push":false,"pull":true},"allow_rebase_merge":true,"template_repository":null,"allow_squash_merge":true,"allow_merge_commit":true,"subscribers_count":42,"network_count":0}},"base":{"label":"octocat:master","ref":"master","sha":"6dcb09b5b57875f334f61aebed695e2e4193db5e","user":{"login":"octocat","id":1,"node_id":"MDQ6VXNlcjE=","avatar_url":"https://github.com/images/error/octocat_happy.gif","gravatar_id":"","url":"https://api.github.com/users/octocat","html_url":"https://github.com/octocat","followers_url":"https://api.github.com/users/octocat/followers","following_url":"https://api.github.com/users/octocat/following{/other_user}","gists_url":"https://api.github.com/users/octocat/gists{/gist_id}","starred_url":"https://api.github.com/users/octocat/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/octocat/subscriptions","organizations_url":"https://api.github.com/users/octocat/orgs","repos_url":"https://api.github.com/users/octocat/repos","events_url":"https://api.github.com/users/octocat/events{/privacy}","received_events_url":"https://api.github.com/users/octocat/received_events","type":"User","site_admin":false},"repo":{"id":1296269,"node_id":"MDEwOlJlcG9zaXRvcnkxMjk2MjY5","name":"Hello-World","full_name":"octocat/Hello-World","owner":{"login":"octocat","id":1,"node_id":"MDQ6VXNlcjE=","avatar_url":"https://github.com/images/error/octocat_happy.gif","gravatar_id":"","url":"https://api.github.com/users/octocat","html_url":"https://github.com/octocat","followers_url":"https://api.github.com/users/octocat/followers","following_url":"https://api.github.com/users/octocat/following{/other_user}","gists_url":"https://api.github.com/users/octocat/gists{/gist_id}","starred_url":"https://api.github.com/users/octocat/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/octocat/subscriptions","organizations_url":"https://api.github.com/users/octocat/orgs","repos_url":"https://api.github.com/users/octocat/repos","events_url":"https://api.github.com/users/octocat/events{/privacy}","received_events_url":"https://api.github.com/users/octocat/received_events","type":"User","site_admin":false},"private":false,"html_url":"https://github.com/octocat/Hello-World","description":"This your first repo!","fork":false,"url":"https://api.github.com/repos/octocat/Hello-World","archive_url":"http://api.github.com/repos/octocat/Hello-World/{archive_format}{/ref}","assignees_url":"http://api.github.com/repos/octocat/Hello-World/assignees{/user}","blobs_url":"http://api.github.com/repos/octocat/Hello-World/git/blobs{/sha}","branches_url":"http://api.github.com/repos/octocat/Hello-World/branches{/branch}","collaborators_url":"http://api.github.com/repos/octocat/Hello-World/collaborators{/collaborator}","comments_url":"http://api.github.com/repos/octocat/Hello-World/comments{/number}","commits_url":"http://api.github.com/repos/octocat/Hello-World/commits{/sha}","compare_url":"http://api.github.com/repos/octocat/Hello-World/compare/{base}...{head}","contents_url":"http://api.github.com/repos/octocat/Hello-World/contents/{+path}","contributors_url":"http://api.github.com/repos/octocat/Hello-World/contributors","deployments_url":"http://api.github.com/repos/octocat/Hello-World/deployments","downloads_url":"http://api.github.com/repos/octocat/Hello-World/downloads","events_url":"http://api.github.com/repos/octocat/Hello-World/events","forks_url":"http://api.github.com/repos/octocat/Hello-World/forks","git_commits_url":"http://api.github.com/repos/octocat/Hello-World/git/commits{/sha}","git_refs_url":"http://api.github.com/repos/octocat/Hello-World/git/refs{/sha}","git_tags_url":"http://api.github.com/repos/octocat/Hello-World/git/tags{/sha}","git_url":"git:github.com/octocat/Hello-World.git","issue_comment_url":"http://api.github.com/repos/octocat/Hello-World/issues/comments{/number}","issue_events_url":"http://api.github.com/repos/octocat/Hello-World/issues/events{/number}","issues_url":"http://api.github.com/repos/octocat/Hello-World/issues{/number}","keys_url":"http://api.github.com/repos/octocat/Hello-World/keys{/key_id}","labels_url":"http://api.github.com/repos/octocat/Hello-World/labels{/name}","languages_url":"http://api.github.com/repos/octocat/Hello-World/languages","merges_url":"http://api.github.com/repos/octocat/Hello-World/merges","milestones_url":"http://api.github.com/repos/octocat/Hello-World/milestones{/number}","notifications_url":"http://api.github.com/repos/octocat/Hello-World/notifications{?since,all,participating}","pulls_url":"http://api.github.com/repos/octocat/Hello-World/pulls{/number}","releases_url":"http://api.github.com/repos/octocat/Hello-World/releases{/id}","ssh_url":"git@github.com:octocat/Hello-World.git","stargazers_url":"http://api.github.com/repos/octocat/Hello-World/stargazers","statuses_url":"http://api.github.com/repos/octocat/Hello-World/statuses/{sha}","subscribers_url":"http://api.github.com/repos/octocat/Hello-World/subscribers","subscription_url":"http://api.github.com/repos/octocat/Hello-World/subscription","tags_url":"http://api.github.com/repos/octocat/Hello-World/tags","teams_url":"http://api.github.com/repos/octocat/Hello-World/teams","trees_url":"http://api.github.com/repos/octocat/Hello-World/git/trees{/sha}","clone_url":"https://github.com/octocat/Hello-World.git","mirror_url":"git:git.example.com/octocat/Hello-World","hooks_url":"http://api.github.com/repos/octocat/Hello-World/hooks","svn_url":"https://svn.github.com/octocat/Hello-World","homepage":"https://github.com","language":null,"forks_count":9,"stargazers_count":80,"watchers_count":80,"size":108,"default_branch":"master","open_issues_count":0,"is_template":true,"topics":["octocat","atom","electron","api"],"has_issues":true,"has_projects":true,"has_wiki":true,"has_pages":false,"has_downloads":true,"archived":false,"disabled":false,"pushed_at":"2011-01-26T19:06:43Z","created_at":"2011-01-26T19:01:12Z","updated_at":"2011-01-26T19:14:43Z","permissions":{"admin":false,"push":false,"pull":true},"allow_rebase_merge":true,"template_repository":null,"allow_squash_merge":true,"allow_merge_commit":true,"subscribers_count":42,"network_count":0}},"_links":{"self":{"href":"https://api.github.com/repos/octocat/Hello-World/pulls/1347"},"html":{"href":"https://github.com/octocat/Hello-World/pull/1347"},"issue":{"href":"https://api.github.com/repos/octocat/Hello-World/issues/1347"},"comments":{"href":"https://api.github.com/repos/octocat/Hello-World/issues/1347/comments"},"review_comments":{"href":"https://api.github.com/repos/octocat/Hello-World/pulls/1347/comments"},"review_comment":{"href":"https://api.github.com/repos/octocat/Hello-World/pulls/comments{/number}"},"commits":{"href":"https://api.github.com/repos/octocat/Hello-World/pulls/1347/commits"},"statuses":{"href":"https://api.github.com/repos/octocat/Hello-World/statuses/6dcb09b5b57875f334f61aebed695e2e4193db5e"}},"author_association":"OWNER","merged":false,"mergeable":true,"rebaseable":true,"mergeable_state":"clean","merged_by":{"login":"octocat","id":1,"node_id":"MDQ6VXNlcjE=","avatar_url":"https://github.com/images/error/octocat_happy.gif","gravatar_id":"","url":"https://api.github.com/users/octocat","html_url":"https://github.com/octocat","followers_url":"https://api.github.com/users/octocat/followers","following_url":"https://api.github.com/users/octocat/following{/other_user}","gists_url":"https://api.github.com/users/octocat/gists{/gist_id}","starred_url":"https://api.github.com/users/octocat/starred{/owner}{/repo}","subscriptions_url":"https://api.github.com/users/octocat/subscriptions","organizations_url":"https://api.github.com/users/octocat/orgs","repos_url":"https://api.github.com/users/octocat/repos","events_url":"https://api.github.com/users/octocat/events{/privacy}","received_events_url":"https://api.github.com/users/octocat/received_events","type":"User","site_admin":false},"comments":10,"review_comments":0,"maintainer_can_modify":true,"commits":3,"additions":100,"deletions":3,"changed_files":5}'
          }
        ]
      }
    ]
  },

  /**
   * The path of "Upload a release asset" has recently changed to
   *
   *     :server/repos/:owner/:repo/releases/:release_id/assets{?name,label}
   *
   * We do not currently handle the `:server` parameter. It should be `baseUrl` in our case.
   * We might keep this workaround permanently, but might simplify it. As we really just want
   * edit `url` and `parameters`, but leaving the remaining fields intact.
   */
  {
    name: "Upload a release asset",
    scope: "repos",
    id: "uploadReleaseAsset",
    method: "POST",
    url: "{url}",
    previews: [],
    description: `This endpoint makes use of [a Hypermedia relation](https://developer.github.com/v3/#hypermedia) to determine which URL to access. The endpoint you call to upload release assets is specific to your release. Use the \`upload_url\` returned in the response of the [Create a release endpoint](https://developer.github.com/v3/repos/releases/#create-a-release) to upload a release asset.

    You need to use an HTTP client which supports [SNI](http://en.wikipedia.org/wiki/Server_Name_Indication) to make calls to this endpoint.
    
    Most libraries will set the required \`Content-Length\` header automatically. Use the required \`Content-Type\` header to provide the media type of the asset. For a list of media types, see [Media Types](https://www.iana.org/assignments/media-types/media-types.xhtml). For example:
    
    \`application/zip\`
    
    GitHub expects the asset data in its raw binary form, rather than JSON. You will send the raw binary content of the asset as the request body. Everything else about the endpoint is the same as the rest of the API. For example, you'll still need to pass your authentication to be able to upload an asset.`,
    documentationUrl:
      "https://developer.github.com/v3/repos/releases/#upload-a-release-asset",
    headers: [],
    parameters: [
      {
        name: "file",
        in: "BODY",
        mapToData: true,
        required: true,
        type: "string | object"
      },
      {
        name: "headers",
        in: "BODY",
        required: true,
        type: "object"
      },
      {
        name: "headers.content-length",
        in: "HEADER",
        required: true,
        type: "integer"
      },
      {
        name: "headers.content-type",
        in: "HEADER",
        required: true,
        type: "string"
      },
      {
        name: "label",
        in: "QUERY",
        type: "string",
        description: `An alternate short description of the asset. Used in place of the filename. This should be set in a URI query parameter.`
      },
      {
        name: "name",
        in: "QUERY",
        required: true,
        type: "string",
        description: `The file name of the asset. This should be set in a URI query parameter.`
      },
      {
        name: "url",
        in: "PATH",
        required: true,
        type: "string",
        description:
          "The `upload_url` key returned from creating or getting a release"
      }
    ],
    responses: [
      {
        code: 201,
        description: "",
        examples: [
          {
            data: JSON.stringify({
              url:
                "https://api.github.com/repos/octocat/Hello-World/releases/assets/1",
              browser_download_url:
                "https://github.com/octocat/Hello-World/releases/download/v1.0.0/example.zip",
              id: 1,
              node_id: "MDEyOlJlbGVhc2VBc3NldDE=",
              name: "example.zip",
              label: "short description",
              state: "uploaded",
              content_type: "application/zip",
              size: 1024,
              download_count: 42,
              created_at: "2013-02-27T19:35:32Z",
              updated_at: "2013-02-27T19:35:32Z",
              uploader: {
                login: "octocat",
                id: 1,
                node_id: "MDQ6VXNlcjE=",
                avatar_url: "https://github.com/images/error/octocat_happy.gif",
                gravatar_id: "",
                url: "https://api.github.com/users/octocat",
                html_url: "https://github.com/octocat",
                followers_url: "https://api.github.com/users/octocat/followers",
                following_url:
                  "https://api.github.com/users/octocat/following{/other_user}",
                gists_url:
                  "https://api.github.com/users/octocat/gists{/gist_id}",
                starred_url:
                  "https://api.github.com/users/octocat/starred{/owner}{/repo}",
                subscriptions_url:
                  "https://api.github.com/users/octocat/subscriptions",
                organizations_url: "https://api.github.com/users/octocat/orgs",
                repos_url: "https://api.github.com/users/octocat/repos",
                events_url:
                  "https://api.github.com/users/octocat/events{/privacy}",
                received_events_url:
                  "https://api.github.com/users/octocat/received_events",
                type: "User",
                site_admin: false
              }
            })
          }
        ]
      }
    ]
  }
];
