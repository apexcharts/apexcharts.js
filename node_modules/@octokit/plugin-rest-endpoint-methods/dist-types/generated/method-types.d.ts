import type { EndpointInterface, RequestInterface } from "@octokit/types";
import type { RestEndpointMethodTypes } from "./parameters-and-response-types";
export type RestEndpointMethods = {
    actions: {
        /**
         * Add custom labels to a self-hosted runner configured in an organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        addCustomLabelsToSelfHostedRunnerForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["addCustomLabelsToSelfHostedRunnerForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["addCustomLabelsToSelfHostedRunnerForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Add custom labels to a self-hosted runner configured in a repository.
         *
         * You must authenticate using an access token with the `repo` scope to use this
         * endpoint.
         */
        addCustomLabelsToSelfHostedRunnerForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["addCustomLabelsToSelfHostedRunnerForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["addCustomLabelsToSelfHostedRunnerForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Adds a repository to an organization secret when the `visibility` for repository access is set to `selected`. The visibility is set when you [Create or update an organization secret](https://docs.github.com/rest/reference/actions#create-or-update-an-organization-secret). You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `secrets` organization permission to use this endpoint.
         */
        addSelectedRepoToOrgSecret: {
            (params?: RestEndpointMethodTypes["actions"]["addSelectedRepoToOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["addSelectedRepoToOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Adds a repository to an organization variable that is available to selected repositories. Organization variables that are available to selected repositories have their `visibility` field set to `selected`. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `organization_actions_variables:write` organization permission to use this endpoint.
         */
        addSelectedRepoToOrgVariable: {
            (params?: RestEndpointMethodTypes["actions"]["addSelectedRepoToOrgVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["addSelectedRepoToOrgVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Adds a repository to a required workflow. To use this endpoint, the required workflow must be configured to run on selected repositories.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         *
         * For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        addSelectedRepoToRequiredWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["addSelectedRepoToRequiredWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["addSelectedRepoToRequiredWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Approves a workflow run for a pull request from a public fork of a first time contributor. For more information, see ["Approving workflow runs from public forks](https://docs.github.com/actions/managing-workflow-runs/approving-workflow-runs-from-public-forks)."
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions:write` permission to use this endpoint.
         */
        approveWorkflowRun: {
            (params?: RestEndpointMethodTypes["actions"]["approveWorkflowRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["approveWorkflowRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Cancels a workflow run using its `id`. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions:write` permission to use this endpoint.
         */
        cancelWorkflowRun: {
            (params?: RestEndpointMethodTypes["actions"]["cancelWorkflowRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["cancelWorkflowRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create an environment variable that you can reference in a GitHub Actions workflow.
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         * GitHub Apps must have the `environment:write` repository permission to use this endpoint.
         */
        createEnvironmentVariable: {
            (params?: RestEndpointMethodTypes["actions"]["createEnvironmentVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createEnvironmentVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates or updates an environment secret with an encrypted value. Encrypt your secret using
         * [LibSodium](https://libsodium.gitbook.io/doc/bindings_for_other_languages). You must authenticate using an access
         * token with the `repo` scope to use this endpoint. GitHub Apps must have the `secrets` repository permission to use
         * this endpoint.
         *
         * **Example encrypting a secret using Node.js**
         *
         * Encrypt your secret using the [libsodium-wrappers](https://www.npmjs.com/package/libsodium-wrappers) library.
         *
         * ```
         * const sodium = require('libsodium-wrappers')
         * const secret = 'plain-text-secret' // replace with the secret you want to encrypt
         * const key = 'base64-encoded-public-key' // replace with the Base64 encoded public key
         *
         * //Check if libsodium is ready and then proceed.
         * sodium.ready.then(() => {
         *   // Convert Secret & Base64 key to Uint8Array.
         *   let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
         *   let binsec = sodium.from_string(secret)
         *
         *   //Encrypt the secret using LibSodium
         *   let encBytes = sodium.crypto_box_seal(binsec, binkey)
         *
         *   // Convert encrypted Uint8Array to Base64
         *   let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
         *
         *   console.log(output)
         * });
         * ```
         *
         * **Example encrypting a secret using Python**
         *
         * Encrypt your secret using [pynacl](https://pynacl.readthedocs.io/en/latest/public/#nacl-public-sealedbox) with Python 3.
         *
         * ```
         * from base64 import b64encode
         * from nacl import encoding, public
         *
         * def encrypt(public_key: str, secret_value: str) -> str:
         *   """Encrypt a Unicode string using the public key."""
         *   public_key = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
         *   sealed_box = public.SealedBox(public_key)
         *   encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
         *   return b64encode(encrypted).decode("utf-8")
         * ```
         *
         * **Example encrypting a secret using C#**
         *
         * Encrypt your secret using the [Sodium.Core](https://www.nuget.org/packages/Sodium.Core/) package.
         *
         * ```
         * var secretValue = System.Text.Encoding.UTF8.GetBytes("mySecret");
         * var publicKey = Convert.FromBase64String("2Sg8iYjAxxmI2LvUXpJjkYrMxURPc8r+dB7TJyvvcCU=");
         *
         * var sealedPublicKeyBox = Sodium.SealedPublicKeyBox.Create(secretValue, publicKey);
         *
         * Console.WriteLine(Convert.ToBase64String(sealedPublicKeyBox));
         * ```
         *
         * **Example encrypting a secret using Ruby**
         *
         * Encrypt your secret using the [rbnacl](https://github.com/RubyCrypto/rbnacl) gem.
         *
         * ```ruby
         * require "rbnacl"
         * require "base64"
         *
         * key = Base64.decode64("+ZYvJDZMHUfBkJdyq5Zm9SKqeuBQ4sj+6sfjlH4CgG0=")
         * public_key = RbNaCl::PublicKey.new(key)
         *
         * box = RbNaCl::Boxes::Sealed.from_public_key(public_key)
         * encrypted_secret = box.encrypt("my_secret")
         *
         * # Print the base64 encoded secret
         * puts Base64.strict_encode64(encrypted_secret)
         * ```
         */
        createOrUpdateEnvironmentSecret: {
            (params?: RestEndpointMethodTypes["actions"]["createOrUpdateEnvironmentSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createOrUpdateEnvironmentSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates or updates an organization secret with an encrypted value. Encrypt your secret using
         * [LibSodium](https://libsodium.gitbook.io/doc/bindings_for_other_languages). You must authenticate using an access
         * token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `secrets` organization permission to
         * use this endpoint.
         *
         * #### Example encrypting a secret using Node.js
         *
         * Encrypt your secret using the [tweetsodium](https://github.com/github/tweetsodium) library.
         *
         * ```
         * const sodium = require('tweetsodium');
         *
         * const key = "base64-encoded-public-key";
         * const value = "plain-text-secret";
         *
         * // Convert the message and key to Uint8Array's (Buffer implements that interface)
         * const messageBytes = Buffer.from(value);
         * const keyBytes = Buffer.from(key, 'base64');
         *
         * // Encrypt using LibSodium.
         * const encryptedBytes = sodium.seal(messageBytes, keyBytes);
         *
         * // Base64 the encrypted secret
         * const encrypted = Buffer.from(encryptedBytes).toString('base64');
         *
         * console.log(encrypted);
         * ```
         *
         *
         * #### Example encrypting a secret using Python
         *
         * Encrypt your secret using [pynacl](https://pynacl.readthedocs.io/en/latest/public/#nacl-public-sealedbox) with Python 3.
         *
         * ```
         * from base64 import b64encode
         * from nacl import encoding, public
         *
         * def encrypt(public_key: str, secret_value: str) -> str:
         *   """Encrypt a Unicode string using the public key."""
         *   public_key = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
         *   sealed_box = public.SealedBox(public_key)
         *   encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
         *   return b64encode(encrypted).decode("utf-8")
         * ```
         *
         * #### Example encrypting a secret using C#
         *
         * Encrypt your secret using the [Sodium.Core](https://www.nuget.org/packages/Sodium.Core/) package.
         *
         * ```
         * var secretValue = System.Text.Encoding.UTF8.GetBytes("mySecret");
         * var publicKey = Convert.FromBase64String("2Sg8iYjAxxmI2LvUXpJjkYrMxURPc8r+dB7TJyvvcCU=");
         *
         * var sealedPublicKeyBox = Sodium.SealedPublicKeyBox.Create(secretValue, publicKey);
         *
         * Console.WriteLine(Convert.ToBase64String(sealedPublicKeyBox));
         * ```
         *
         * #### Example encrypting a secret using Ruby
         *
         * Encrypt your secret using the [rbnacl](https://github.com/RubyCrypto/rbnacl) gem.
         *
         * ```ruby
         * require "rbnacl"
         * require "base64"
         *
         * key = Base64.decode64("+ZYvJDZMHUfBkJdyq5Zm9SKqeuBQ4sj+6sfjlH4CgG0=")
         * public_key = RbNaCl::PublicKey.new(key)
         *
         * box = RbNaCl::Boxes::Sealed.from_public_key(public_key)
         * encrypted_secret = box.encrypt("my_secret")
         *
         * # Print the base64 encoded secret
         * puts Base64.strict_encode64(encrypted_secret)
         * ```
         */
        createOrUpdateOrgSecret: {
            (params?: RestEndpointMethodTypes["actions"]["createOrUpdateOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createOrUpdateOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates or updates a repository secret with an encrypted value. Encrypt your secret using
         * [LibSodium](https://libsodium.gitbook.io/doc/bindings_for_other_languages). You must authenticate using an access
         * token with the `repo` scope to use this endpoint. GitHub Apps must have the `secrets` repository permission to use
         * this endpoint.
         *
         * **Example encrypting a secret using Node.js**
         *
         * Encrypt your secret using the [libsodium-wrappers](https://www.npmjs.com/package/libsodium-wrappers) library.
         *
         * ```
         * const sodium = require('libsodium-wrappers')
         * const secret = 'plain-text-secret' // replace with the secret you want to encrypt
         * const key = 'base64-encoded-public-key' // replace with the Base64 encoded public key
         *
         * //Check if libsodium is ready and then proceed.
         * sodium.ready.then(() => {
         *   // Convert Secret & Base64 key to Uint8Array.
         *   let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
         *   let binsec = sodium.from_string(secret)
         *
         *   //Encrypt the secret using LibSodium
         *   let encBytes = sodium.crypto_box_seal(binsec, binkey)
         *
         *   // Convert encrypted Uint8Array to Base64
         *   let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
         *
         *   console.log(output)
         * });
         * ```
         *
         * **Example encrypting a secret using Python**
         *
         * Encrypt your secret using [pynacl](https://pynacl.readthedocs.io/en/latest/public/#nacl-public-sealedbox) with Python 3.
         *
         * ```
         * from base64 import b64encode
         * from nacl import encoding, public
         *
         * def encrypt(public_key: str, secret_value: str) -> str:
         *   """Encrypt a Unicode string using the public key."""
         *   public_key = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
         *   sealed_box = public.SealedBox(public_key)
         *   encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
         *   return b64encode(encrypted).decode("utf-8")
         * ```
         *
         * **Example encrypting a secret using C#**
         *
         * Encrypt your secret using the [Sodium.Core](https://www.nuget.org/packages/Sodium.Core/) package.
         *
         * ```
         * var secretValue = System.Text.Encoding.UTF8.GetBytes("mySecret");
         * var publicKey = Convert.FromBase64String("2Sg8iYjAxxmI2LvUXpJjkYrMxURPc8r+dB7TJyvvcCU=");
         *
         * var sealedPublicKeyBox = Sodium.SealedPublicKeyBox.Create(secretValue, publicKey);
         *
         * Console.WriteLine(Convert.ToBase64String(sealedPublicKeyBox));
         * ```
         *
         * **Example encrypting a secret using Ruby**
         *
         * Encrypt your secret using the [rbnacl](https://github.com/RubyCrypto/rbnacl) gem.
         *
         * ```ruby
         * require "rbnacl"
         * require "base64"
         *
         * key = Base64.decode64("+ZYvJDZMHUfBkJdyq5Zm9SKqeuBQ4sj+6sfjlH4CgG0=")
         * public_key = RbNaCl::PublicKey.new(key)
         *
         * box = RbNaCl::Boxes::Sealed.from_public_key(public_key)
         * encrypted_secret = box.encrypt("my_secret")
         *
         * # Print the base64 encoded secret
         * puts Base64.strict_encode64(encrypted_secret)
         * ```
         */
        createOrUpdateRepoSecret: {
            (params?: RestEndpointMethodTypes["actions"]["createOrUpdateRepoSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createOrUpdateRepoSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates an organization variable that you can reference in a GitHub Actions workflow.
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         * GitHub Apps must have the `organization_actions_variables:write` organization permission to use this endpoint.
         */
        createOrgVariable: {
            (params?: RestEndpointMethodTypes["actions"]["createOrgVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createOrgVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a token that you can pass to the `config` script. The token expires after one hour.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         *
         * #### Example using registration token
         *
         * Configure your self-hosted runner, replacing `TOKEN` with the registration token provided by this endpoint.
         *
         * ```
         * ./config.sh --url https://github.com/octo-org --token TOKEN
         * ```
         */
        createRegistrationTokenForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["createRegistrationTokenForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createRegistrationTokenForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a token that you can pass to the `config` script. The token expires after one hour. You must authenticate
         * using an access token with the `repo` scope to use this endpoint.
         *
         * #### Example using registration token
         *
         * Configure your self-hosted runner, replacing `TOKEN` with the registration token provided by this endpoint.
         *
         * ```
         * ./config.sh --url https://github.com/octo-org/octo-repo-artifacts --token TOKEN
         * ```
         */
        createRegistrationTokenForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["createRegistrationTokenForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createRegistrationTokenForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a token that you can pass to the `config` script to remove a self-hosted runner from an organization. The token expires after one hour.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         *
         * #### Example using remove token
         *
         * To remove your self-hosted runner from an organization, replace `TOKEN` with the remove token provided by this
         * endpoint.
         *
         * ```
         * ./config.sh remove --token TOKEN
         * ```
         */
        createRemoveTokenForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["createRemoveTokenForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createRemoveTokenForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a token that you can pass to remove a self-hosted runner from a repository. The token expires after one hour.
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         *
         * #### Example using remove token
         *
         * To remove your self-hosted runner from a repository, replace TOKEN with the remove token provided by this endpoint.
         *
         * ```
         * ./config.sh remove --token TOKEN
         * ```
         */
        createRemoveTokenForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["createRemoveTokenForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createRemoveTokenForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a repository variable that you can reference in a GitHub Actions workflow.
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         * GitHub Apps must have the `actions_variables:write` repository permission to use this endpoint.
         */
        createRepoVariable: {
            (params?: RestEndpointMethodTypes["actions"]["createRepoVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createRepoVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a required workflow in an organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         *
         * For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        createRequiredWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["createRequiredWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createRequiredWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You can use this endpoint to manually trigger a GitHub Actions workflow run. You can replace `workflow_id` with the workflow file name. For example, you could use `main.yaml`.
         *
         * You must configure your GitHub Actions workflow to run when the [`workflow_dispatch` webhook](/developers/webhooks-and-events/webhook-events-and-payloads#workflow_dispatch) event occurs. The `inputs` are configured in the workflow file. For more information about how to configure the `workflow_dispatch` event in the workflow file, see "[Events that trigger workflows](/actions/reference/events-that-trigger-workflows#workflow_dispatch)."
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions:write` permission to use this endpoint. For more information, see "[Creating a personal access token for the command line](https://docs.github.com/articles/creating-a-personal-access-token-for-the-command-line)."
         */
        createWorkflowDispatch: {
            (params?: RestEndpointMethodTypes["actions"]["createWorkflowDispatch"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["createWorkflowDispatch"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a GitHub Actions cache for a repository, using a cache ID.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         *
         * GitHub Apps must have the `actions:write` permission to use this endpoint.
         */
        deleteActionsCacheById: {
            (params?: RestEndpointMethodTypes["actions"]["deleteActionsCacheById"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteActionsCacheById"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes one or more GitHub Actions caches for a repository, using a complete cache key. By default, all caches that match the provided key are deleted, but you can optionally provide a Git ref to restrict deletions to caches that match both the provided key and the Git ref.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         *
         * GitHub Apps must have the `actions:write` permission to use this endpoint.
         */
        deleteActionsCacheByKey: {
            (params?: RestEndpointMethodTypes["actions"]["deleteActionsCacheByKey"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteActionsCacheByKey"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes an artifact for a workflow run. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions:write` permission to use this endpoint.
         */
        deleteArtifact: {
            (params?: RestEndpointMethodTypes["actions"]["deleteArtifact"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteArtifact"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a secret in an environment using the secret name. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `secrets` repository permission to use this endpoint.
         */
        deleteEnvironmentSecret: {
            (params?: RestEndpointMethodTypes["actions"]["deleteEnvironmentSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteEnvironmentSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes an environment variable using the variable name.
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         * GitHub Apps must have the `environment:write` repository permission to use this endpoint.
         */
        deleteEnvironmentVariable: {
            (params?: RestEndpointMethodTypes["actions"]["deleteEnvironmentVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteEnvironmentVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a secret in an organization using the secret name. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `secrets` organization permission to use this endpoint.
         */
        deleteOrgSecret: {
            (params?: RestEndpointMethodTypes["actions"]["deleteOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes an organization variable using the variable name.
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         * GitHub Apps must have the `organization_actions_variables:write` organization permission to use this endpoint.
         */
        deleteOrgVariable: {
            (params?: RestEndpointMethodTypes["actions"]["deleteOrgVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteOrgVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a secret in a repository using the secret name. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `secrets` repository permission to use this endpoint.
         */
        deleteRepoSecret: {
            (params?: RestEndpointMethodTypes["actions"]["deleteRepoSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteRepoSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a repository variable using the variable name.
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         * GitHub Apps must have the `actions_variables:write` repository permission to use this endpoint.
         */
        deleteRepoVariable: {
            (params?: RestEndpointMethodTypes["actions"]["deleteRepoVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteRepoVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a required workflow configured in an organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         *
         * For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        deleteRequiredWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["deleteRequiredWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteRequiredWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Forces the removal of a self-hosted runner from an organization. You can use this endpoint to completely remove the runner when the machine you were using no longer exists.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        deleteSelfHostedRunnerFromOrg: {
            (params?: RestEndpointMethodTypes["actions"]["deleteSelfHostedRunnerFromOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteSelfHostedRunnerFromOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Forces the removal of a self-hosted runner from a repository. You can use this endpoint to completely remove the runner when the machine you were using no longer exists.
         *
         * You must authenticate using an access token with the `repo`
         * scope to use this endpoint.
         */
        deleteSelfHostedRunnerFromRepo: {
            (params?: RestEndpointMethodTypes["actions"]["deleteSelfHostedRunnerFromRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteSelfHostedRunnerFromRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Delete a specific workflow run. Anyone with write access to the repository can use this endpoint. If the repository is
         * private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:write` permission to use
         * this endpoint.
         */
        deleteWorkflowRun: {
            (params?: RestEndpointMethodTypes["actions"]["deleteWorkflowRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteWorkflowRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes all logs for a workflow run. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions:write` permission to use this endpoint.
         */
        deleteWorkflowRunLogs: {
            (params?: RestEndpointMethodTypes["actions"]["deleteWorkflowRunLogs"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["deleteWorkflowRunLogs"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a repository from the list of selected repositories that are enabled for GitHub Actions in an organization. To use this endpoint, the organization permission policy for `enabled_repositories` must be configured to `selected`. For more information, see "[Set GitHub Actions permissions for an organization](#set-github-actions-permissions-for-an-organization)."
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `administration` organization permission to use this API.
         */
        disableSelectedRepositoryGithubActionsOrganization: {
            (params?: RestEndpointMethodTypes["actions"]["disableSelectedRepositoryGithubActionsOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["disableSelectedRepositoryGithubActionsOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Disables a workflow and sets the `state` of the workflow to `disabled_manually`. You can replace `workflow_id` with the workflow file name. For example, you could use `main.yaml`.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions:write` permission to use this endpoint.
         */
        disableWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["disableWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["disableWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a redirect URL to download an archive for a repository. This URL expires after 1 minute. Look for `Location:` in
         * the response header to find the URL for the download. The `:archive_format` must be `zip`. Anyone with read access to
         * the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope.
         * GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        downloadArtifact: {
            (params?: RestEndpointMethodTypes["actions"]["downloadArtifact"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["downloadArtifact"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a redirect URL to download a plain text file of logs for a workflow job. This link expires after 1 minute. Look
         * for `Location:` in the response header to find the URL for the download. Anyone with read access to the repository can
         * use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must
         * have the `actions:read` permission to use this endpoint.
         */
        downloadJobLogsForWorkflowRun: {
            (params?: RestEndpointMethodTypes["actions"]["downloadJobLogsForWorkflowRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["downloadJobLogsForWorkflowRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a redirect URL to download an archive of log files for a specific workflow run attempt. This link expires after
         * 1 minute. Look for `Location:` in the response header to find the URL for the download. Anyone with read access to
         * the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope.
         * GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        downloadWorkflowRunAttemptLogs: {
            (params?: RestEndpointMethodTypes["actions"]["downloadWorkflowRunAttemptLogs"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["downloadWorkflowRunAttemptLogs"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a redirect URL to download an archive of log files for a workflow run. This link expires after 1 minute. Look for
         * `Location:` in the response header to find the URL for the download. Anyone with read access to the repository can use
         * this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have
         * the `actions:read` permission to use this endpoint.
         */
        downloadWorkflowRunLogs: {
            (params?: RestEndpointMethodTypes["actions"]["downloadWorkflowRunLogs"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["downloadWorkflowRunLogs"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Adds a repository to the list of selected repositories that are enabled for GitHub Actions in an organization. To use this endpoint, the organization permission policy for `enabled_repositories` must be must be configured to `selected`. For more information, see "[Set GitHub Actions permissions for an organization](#set-github-actions-permissions-for-an-organization)."
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `administration` organization permission to use this API.
         */
        enableSelectedRepositoryGithubActionsOrganization: {
            (params?: RestEndpointMethodTypes["actions"]["enableSelectedRepositoryGithubActionsOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["enableSelectedRepositoryGithubActionsOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Enables a workflow and sets the `state` of the workflow to `active`. You can replace `workflow_id` with the workflow file name. For example, you could use `main.yaml`.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions:write` permission to use this endpoint.
         */
        enableWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["enableWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["enableWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Generates a configuration that can be passed to the runner application at startup.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        generateRunnerJitconfigForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["generateRunnerJitconfigForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["generateRunnerJitconfigForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Generates a configuration that can be passed to the runner application at startup.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         */
        generateRunnerJitconfigForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["generateRunnerJitconfigForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["generateRunnerJitconfigForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the GitHub Actions caches for a repository.
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         * GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getActionsCacheList: {
            (params?: RestEndpointMethodTypes["actions"]["getActionsCacheList"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getActionsCacheList"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets GitHub Actions cache usage for a repository.
         * The data fetched using this API is refreshed approximately every 5 minutes, so values returned from this endpoint may take at least 5 minutes to get updated.
         * Anyone with read access to the repository can use this endpoint. If the repository is private, you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getActionsCacheUsage: {
            (params?: RestEndpointMethodTypes["actions"]["getActionsCacheUsage"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getActionsCacheUsage"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists repositories and their GitHub Actions cache usage for an organization.
         * The data fetched using this API is refreshed approximately every 5 minutes, so values returned from this endpoint may take at least 5 minutes to get updated.
         * You must authenticate using an access token with the `read:org` scope to use this endpoint. GitHub Apps must have the `organization_admistration:read` permission to use this endpoint.
         */
        getActionsCacheUsageByRepoForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["getActionsCacheUsageByRepoForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getActionsCacheUsageByRepoForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the total GitHub Actions cache usage for an organization.
         * The data fetched using this API is refreshed approximately every 5 minutes, so values returned from this endpoint may take at least 5 minutes to get updated.
         * You must authenticate using an access token with the `read:org` scope to use this endpoint. GitHub Apps must have the `organization_admistration:read` permission to use this endpoint.
         */
        getActionsCacheUsageForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["getActionsCacheUsageForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getActionsCacheUsageForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the selected actions and reusable workflows that are allowed in an organization. To use this endpoint, the organization permission policy for `allowed_actions` must be configured to `selected`. For more information, see "[Set GitHub Actions permissions for an organization](#set-github-actions-permissions-for-an-organization).""
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `administration` organization permission to use this API.
         */
        getAllowedActionsOrganization: {
            (params?: RestEndpointMethodTypes["actions"]["getAllowedActionsOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getAllowedActionsOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the settings for selected actions and reusable workflows that are allowed in a repository. To use this endpoint, the repository policy for `allowed_actions` must be configured to `selected`. For more information, see "[Set GitHub Actions permissions for a repository](#set-github-actions-permissions-for-a-repository)."
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `administration` repository permission to use this API.
         */
        getAllowedActionsRepository: {
            (params?: RestEndpointMethodTypes["actions"]["getAllowedActionsRepository"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getAllowedActionsRepository"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific artifact for a workflow run. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getArtifact: {
            (params?: RestEndpointMethodTypes["actions"]["getArtifact"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getArtifact"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get the public key for an environment, which you need to encrypt environment secrets. You need to encrypt a secret before you can create or update secrets. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `secrets` repository permission to use this endpoint.
         */
        getEnvironmentPublicKey: {
            (params?: RestEndpointMethodTypes["actions"]["getEnvironmentPublicKey"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getEnvironmentPublicKey"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a single environment secret without revealing its encrypted value. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `secrets` repository permission to use this endpoint.
         */
        getEnvironmentSecret: {
            (params?: RestEndpointMethodTypes["actions"]["getEnvironmentSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getEnvironmentSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific variable in an environment. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `environments:read` repository permission to use this endpoint.
         */
        getEnvironmentVariable: {
            (params?: RestEndpointMethodTypes["actions"]["getEnvironmentVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getEnvironmentVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the default workflow permissions granted to the `GITHUB_TOKEN` when running workflows in an organization,
         * as well as whether GitHub Actions can submit approving pull request reviews. For more information, see
         * "[Setting the permissions of the GITHUB_TOKEN for your organization](https://docs.github.com/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#setting-the-permissions-of-the-github_token-for-your-organization)."
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `administration` organization permission to use this API.
         */
        getGithubActionsDefaultWorkflowPermissionsOrganization: {
            (params?: RestEndpointMethodTypes["actions"]["getGithubActionsDefaultWorkflowPermissionsOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getGithubActionsDefaultWorkflowPermissionsOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the default workflow permissions granted to the `GITHUB_TOKEN` when running workflows in a repository,
         * as well as if GitHub Actions can submit approving pull request reviews.
         * For more information, see "[Setting the permissions of the GITHUB_TOKEN for your repository](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#setting-the-permissions-of-the-github_token-for-your-repository)."
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the repository `administration` permission to use this API.
         */
        getGithubActionsDefaultWorkflowPermissionsRepository: {
            (params?: RestEndpointMethodTypes["actions"]["getGithubActionsDefaultWorkflowPermissionsRepository"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getGithubActionsDefaultWorkflowPermissionsRepository"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the GitHub Actions permissions policy for repositories and allowed actions and reusable workflows in an organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `administration` organization permission to use this API.
         */
        getGithubActionsPermissionsOrganization: {
            (params?: RestEndpointMethodTypes["actions"]["getGithubActionsPermissionsOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getGithubActionsPermissionsOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the GitHub Actions permissions policy for a repository, including whether GitHub Actions is enabled and the actions and reusable workflows allowed to run in the repository.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `administration` repository permission to use this API.
         */
        getGithubActionsPermissionsRepository: {
            (params?: RestEndpointMethodTypes["actions"]["getGithubActionsPermissionsRepository"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getGithubActionsPermissionsRepository"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific job in a workflow run. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getJobForWorkflowRun: {
            (params?: RestEndpointMethodTypes["actions"]["getJobForWorkflowRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getJobForWorkflowRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets your public key, which you need to encrypt secrets. You need to encrypt a secret before you can create or update secrets. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `secrets` organization permission to use this endpoint.
         */
        getOrgPublicKey: {
            (params?: RestEndpointMethodTypes["actions"]["getOrgPublicKey"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getOrgPublicKey"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a single organization secret without revealing its encrypted value. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `secrets` organization permission to use this endpoint.
         */
        getOrgSecret: {
            (params?: RestEndpointMethodTypes["actions"]["getOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific variable in an organization. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `organization_actions_variables:read` organization permission to use this endpoint.
         */
        getOrgVariable: {
            (params?: RestEndpointMethodTypes["actions"]["getOrgVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getOrgVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get all deployment environments for a workflow run that are waiting for protection rules to pass.
         *
         * Anyone with read access to the repository can use this endpoint. If the repository is private, you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getPendingDeploymentsForRun: {
            (params?: RestEndpointMethodTypes["actions"]["getPendingDeploymentsForRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getPendingDeploymentsForRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the GitHub Actions permissions policy for a repository, including whether GitHub Actions is enabled and the actions and reusable workflows allowed to run in the repository.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `administration` repository permission to use this API.
         * @deprecated octokit.rest.actions.getRepoPermissions() has been renamed to octokit.rest.actions.getGithubActionsPermissionsRepository() (2020-11-10)
         */
        getRepoPermissions: {
            (params?: RestEndpointMethodTypes["actions"]["getRepoPermissions"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getRepoPermissions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets your public key, which you need to encrypt secrets. You need to encrypt a secret before you can create or update secrets. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `secrets` repository permission to use this endpoint.
         */
        getRepoPublicKey: {
            (params?: RestEndpointMethodTypes["actions"]["getRepoPublicKey"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getRepoPublicKey"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific required workflow present in a repository. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint. For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        getRepoRequiredWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["getRepoRequiredWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getRepoRequiredWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the number of billable minutes used by a specific required workflow during the current billing cycle.
         *
         * Billable minutes only apply to required workflows running in private repositories that use GitHub-hosted runners. Usage is listed for each GitHub-hosted runner operating system in milliseconds. Any job re-runs are also included in the usage. The usage does not include the multiplier for macOS and Windows runners and is not rounded up to the nearest whole minute. For more information, see "[Managing billing for GitHub Actions](https://docs.github.com/github/setting-up-and-managing-billing-and-payments-on-github/managing-billing-for-github-actions)."
         *
         * Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getRepoRequiredWorkflowUsage: {
            (params?: RestEndpointMethodTypes["actions"]["getRepoRequiredWorkflowUsage"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getRepoRequiredWorkflowUsage"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a single repository secret without revealing its encrypted value. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `secrets` repository permission to use this endpoint.
         */
        getRepoSecret: {
            (params?: RestEndpointMethodTypes["actions"]["getRepoSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getRepoSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific variable in a repository. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions_variables:read` repository permission to use this endpoint.
         */
        getRepoVariable: {
            (params?: RestEndpointMethodTypes["actions"]["getRepoVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getRepoVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get a required workflow configured in an organization.
         *
         * You must authenticate using an access token with the `read:org` scope to use this endpoint.
         *
         * For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        getRequiredWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["getRequiredWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getRequiredWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Anyone with read access to the repository can use this endpoint. If the repository is private, you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getReviewsForRun: {
            (params?: RestEndpointMethodTypes["actions"]["getReviewsForRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getReviewsForRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific self-hosted runner configured in an organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        getSelfHostedRunnerForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["getSelfHostedRunnerForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getSelfHostedRunnerForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific self-hosted runner configured in a repository.
         *
         * You must authenticate using an access token with the `repo` scope to use this
         * endpoint.
         */
        getSelfHostedRunnerForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["getSelfHostedRunnerForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getSelfHostedRunnerForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific workflow. You can replace `workflow_id` with the workflow file name. For example, you could use `main.yaml`. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["getWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the level of access that workflows outside of the repository have to actions and reusable workflows in the repository.
         * This endpoint only applies to private repositories.
         * For more information, see "[Allowing access to components in a private repository](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#allowing-access-to-components-in-a-private-repository)."
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the
         * repository `administration` permission to use this endpoint.
         */
        getWorkflowAccessToRepository: {
            (params?: RestEndpointMethodTypes["actions"]["getWorkflowAccessToRepository"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getWorkflowAccessToRepository"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific workflow run. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getWorkflowRun: {
            (params?: RestEndpointMethodTypes["actions"]["getWorkflowRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getWorkflowRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific workflow run attempt. Anyone with read access to the repository
         * can use this endpoint. If the repository is private you must use an access token
         * with the `repo` scope. GitHub Apps must have the `actions:read` permission to
         * use this endpoint.
         */
        getWorkflowRunAttempt: {
            (params?: RestEndpointMethodTypes["actions"]["getWorkflowRunAttempt"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getWorkflowRunAttempt"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the number of billable minutes and total run time for a specific workflow run. Billable minutes only apply to workflows in private repositories that use GitHub-hosted runners. Usage is listed for each GitHub-hosted runner operating system in milliseconds. Any job re-runs are also included in the usage. The usage does not include the multiplier for macOS and Windows runners and is not rounded up to the nearest whole minute. For more information, see "[Managing billing for GitHub Actions](https://docs.github.com/github/setting-up-and-managing-billing-and-payments-on-github/managing-billing-for-github-actions)".
         *
         * Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getWorkflowRunUsage: {
            (params?: RestEndpointMethodTypes["actions"]["getWorkflowRunUsage"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getWorkflowRunUsage"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the number of billable minutes used by a specific workflow during the current billing cycle. Billable minutes only apply to workflows in private repositories that use GitHub-hosted runners. Usage is listed for each GitHub-hosted runner operating system in milliseconds. Any job re-runs are also included in the usage. The usage does not include the multiplier for macOS and Windows runners and is not rounded up to the nearest whole minute. For more information, see "[Managing billing for GitHub Actions](https://docs.github.com/github/setting-up-and-managing-billing-and-payments-on-github/managing-billing-for-github-actions)".
         *
         * You can replace `workflow_id` with the workflow file name. For example, you could use `main.yaml`. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getWorkflowUsage: {
            (params?: RestEndpointMethodTypes["actions"]["getWorkflowUsage"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["getWorkflowUsage"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all artifacts for a repository. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        listArtifactsForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["listArtifactsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listArtifactsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all secrets available in an environment without revealing their encrypted values. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `secrets` repository permission to use this endpoint.
         */
        listEnvironmentSecrets: {
            (params?: RestEndpointMethodTypes["actions"]["listEnvironmentSecrets"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listEnvironmentSecrets"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all environment variables. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `environments:read` repository permission to use this endpoint.
         */
        listEnvironmentVariables: {
            (params?: RestEndpointMethodTypes["actions"]["listEnvironmentVariables"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listEnvironmentVariables"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists jobs for a workflow run. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint. You can use parameters to narrow the list of results. For more information about using parameters, see [Parameters](https://docs.github.com/rest/overview/resources-in-the-rest-api#parameters).
         */
        listJobsForWorkflowRun: {
            (params?: RestEndpointMethodTypes["actions"]["listJobsForWorkflowRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listJobsForWorkflowRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists jobs for a specific workflow run attempt. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint. You can use parameters to narrow the list of results. For more information about using parameters, see [Parameters](https://docs.github.com/rest/overview/resources-in-the-rest-api#parameters).
         */
        listJobsForWorkflowRunAttempt: {
            (params?: RestEndpointMethodTypes["actions"]["listJobsForWorkflowRunAttempt"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listJobsForWorkflowRunAttempt"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all labels for a self-hosted runner configured in an organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        listLabelsForSelfHostedRunnerForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["listLabelsForSelfHostedRunnerForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listLabelsForSelfHostedRunnerForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all labels for a self-hosted runner configured in a repository.
         *
         * You must authenticate using an access token with the `repo` scope to use this
         * endpoint.
         */
        listLabelsForSelfHostedRunnerForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["listLabelsForSelfHostedRunnerForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listLabelsForSelfHostedRunnerForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all secrets available in an organization without revealing their encrypted values. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `secrets` organization permission to use this endpoint.
         */
        listOrgSecrets: {
            (params?: RestEndpointMethodTypes["actions"]["listOrgSecrets"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listOrgSecrets"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all organization variables. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `organization_actions_variables:read` organization permission to use this endpoint.
         */
        listOrgVariables: {
            (params?: RestEndpointMethodTypes["actions"]["listOrgVariables"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listOrgVariables"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all organization secrets shared with a repository without revealing their encrypted values. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `secrets` repository permission to use this endpoint.
         */
        listRepoOrganizationSecrets: {
            (params?: RestEndpointMethodTypes["actions"]["listRepoOrganizationSecrets"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listRepoOrganizationSecrets"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all organiation variables shared with a repository. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions_variables:read` repository permission to use this endpoint.
         */
        listRepoOrganizationVariables: {
            (params?: RestEndpointMethodTypes["actions"]["listRepoOrganizationVariables"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listRepoOrganizationVariables"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the required workflows in a repository. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint. For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        listRepoRequiredWorkflows: {
            (params?: RestEndpointMethodTypes["actions"]["listRepoRequiredWorkflows"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listRepoRequiredWorkflows"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all secrets available in a repository without revealing their encrypted values. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `secrets` repository permission to use this endpoint.
         */
        listRepoSecrets: {
            (params?: RestEndpointMethodTypes["actions"]["listRepoSecrets"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listRepoSecrets"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all repository variables. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions_variables:read` repository permission to use this endpoint.
         */
        listRepoVariables: {
            (params?: RestEndpointMethodTypes["actions"]["listRepoVariables"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listRepoVariables"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the workflows in a repository. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        listRepoWorkflows: {
            (params?: RestEndpointMethodTypes["actions"]["listRepoWorkflows"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listRepoWorkflows"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all workflow runs for a required workflow. You can use parameters to narrow the list of results. For more information about using parameters, see [Parameters](https://docs.github.com/rest/overview/resources-in-the-rest-api#parameters).
         *
         * Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        listRequiredWorkflowRuns: {
            (params?: RestEndpointMethodTypes["actions"]["listRequiredWorkflowRuns"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listRequiredWorkflowRuns"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all required workflows in an organization.
         *
         * You must authenticate using an access token with the `read:org` scope to use this endpoint.
         *
         * For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        listRequiredWorkflows: {
            (params?: RestEndpointMethodTypes["actions"]["listRequiredWorkflows"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listRequiredWorkflows"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists binaries for the runner application that you can download and run.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        listRunnerApplicationsForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["listRunnerApplicationsForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listRunnerApplicationsForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists binaries for the runner application that you can download and run.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         */
        listRunnerApplicationsForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["listRunnerApplicationsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listRunnerApplicationsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all repositories that have been selected when the `visibility` for repository access to a secret is set to `selected`. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `secrets` organization permission to use this endpoint.
         */
        listSelectedReposForOrgSecret: {
            (params?: RestEndpointMethodTypes["actions"]["listSelectedReposForOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listSelectedReposForOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all repositories that can access an organization variable that is available to selected repositories. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `organization_actions_variables:read` organization permission to use this endpoint.
         */
        listSelectedReposForOrgVariable: {
            (params?: RestEndpointMethodTypes["actions"]["listSelectedReposForOrgVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listSelectedReposForOrgVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the selected repositories that are enabled for GitHub Actions in an organization. To use this endpoint, the organization permission policy for `enabled_repositories` must be configured to `selected`. For more information, see "[Set GitHub Actions permissions for an organization](#set-github-actions-permissions-for-an-organization)."
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `administration` organization permission to use this API.
         */
        listSelectedRepositoriesEnabledGithubActionsOrganization: {
            (params?: RestEndpointMethodTypes["actions"]["listSelectedRepositoriesEnabledGithubActionsOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listSelectedRepositoriesEnabledGithubActionsOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the selected repositories that are configured for a required workflow in an organization. To use this endpoint, the required workflow must be configured to run on selected repositories.
         *
         * You must authenticate using an access token with the `read:org` scope to use this endpoint. GitHub Apps must have the `administration` organization permission to use this endpoint.
         *
         * For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        listSelectedRepositoriesRequiredWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["listSelectedRepositoriesRequiredWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listSelectedRepositoriesRequiredWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all self-hosted runners configured in an organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        listSelfHostedRunnersForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["listSelfHostedRunnersForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listSelfHostedRunnersForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all self-hosted runners configured in a repository. You must authenticate using an access token with the `repo` scope to use this endpoint.
         */
        listSelfHostedRunnersForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["listSelfHostedRunnersForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listSelfHostedRunnersForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists artifacts for a workflow run. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        listWorkflowRunArtifacts: {
            (params?: RestEndpointMethodTypes["actions"]["listWorkflowRunArtifacts"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listWorkflowRunArtifacts"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all workflow runs for a workflow. You can replace `workflow_id` with the workflow file name. For example, you could use `main.yaml`. You can use parameters to narrow the list of results. For more information about using parameters, see [Parameters](https://docs.github.com/rest/overview/resources-in-the-rest-api#parameters).
         *
         * Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope.
         */
        listWorkflowRuns: {
            (params?: RestEndpointMethodTypes["actions"]["listWorkflowRuns"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listWorkflowRuns"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all workflow runs for a repository. You can use parameters to narrow the list of results. For more information about using parameters, see [Parameters](https://docs.github.com/rest/overview/resources-in-the-rest-api#parameters).
         *
         * Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        listWorkflowRunsForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["listWorkflowRunsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["listWorkflowRunsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Re-run a job and its dependent jobs in a workflow run. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions:write` permission to use this endpoint.
         */
        reRunJobForWorkflowRun: {
            (params?: RestEndpointMethodTypes["actions"]["reRunJobForWorkflowRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["reRunJobForWorkflowRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Re-runs your workflow run using its `id`. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `actions:write` permission to use this endpoint.
         */
        reRunWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["reRunWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["reRunWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Re-run all of the failed jobs and their dependent jobs in a workflow run using the `id` of the workflow run. You must authenticate using an access token with the `repo` scope to use this endpoint.
         */
        reRunWorkflowFailedJobs: {
            (params?: RestEndpointMethodTypes["actions"]["reRunWorkflowFailedJobs"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["reRunWorkflowFailedJobs"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Remove all custom labels from a self-hosted runner configured in an
         * organization. Returns the remaining read-only labels from the runner.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        removeAllCustomLabelsFromSelfHostedRunnerForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["removeAllCustomLabelsFromSelfHostedRunnerForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["removeAllCustomLabelsFromSelfHostedRunnerForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Remove all custom labels from a self-hosted runner configured in a
         * repository. Returns the remaining read-only labels from the runner.
         *
         * You must authenticate using an access token with the `repo` scope to use this
         * endpoint.
         */
        removeAllCustomLabelsFromSelfHostedRunnerForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["removeAllCustomLabelsFromSelfHostedRunnerForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["removeAllCustomLabelsFromSelfHostedRunnerForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Remove a custom label from a self-hosted runner configured
         * in an organization. Returns the remaining labels from the runner.
         *
         * This endpoint returns a `404 Not Found` status if the custom label is not
         * present on the runner.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        removeCustomLabelFromSelfHostedRunnerForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["removeCustomLabelFromSelfHostedRunnerForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["removeCustomLabelFromSelfHostedRunnerForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Remove a custom label from a self-hosted runner configured
         * in a repository. Returns the remaining labels from the runner.
         *
         * This endpoint returns a `404 Not Found` status if the custom label is not
         * present on the runner.
         *
         * You must authenticate using an access token with the `repo` scope to use this
         * endpoint.
         */
        removeCustomLabelFromSelfHostedRunnerForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["removeCustomLabelFromSelfHostedRunnerForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["removeCustomLabelFromSelfHostedRunnerForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a repository from an organization secret when the `visibility` for repository access is set to `selected`. The visibility is set when you [Create or update an organization secret](https://docs.github.com/rest/reference/actions#create-or-update-an-organization-secret). You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `secrets` organization permission to use this endpoint.
         */
        removeSelectedRepoFromOrgSecret: {
            (params?: RestEndpointMethodTypes["actions"]["removeSelectedRepoFromOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["removeSelectedRepoFromOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a repository from an organization variable that is available to selected repositories. Organization variables that are available to selected repositories have their `visibility` field set to `selected`. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `organization_actions_variables:write` organization permission to use this endpoint.
         */
        removeSelectedRepoFromOrgVariable: {
            (params?: RestEndpointMethodTypes["actions"]["removeSelectedRepoFromOrgVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["removeSelectedRepoFromOrgVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a repository from a required workflow. To use this endpoint, the required workflow must be configured to run on selected repositories.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         *
         * For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        removeSelectedRepoFromRequiredWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["removeSelectedRepoFromRequiredWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["removeSelectedRepoFromRequiredWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Approve or reject custom deployment protection rules provided by a GitHub App for a workflow run. For more information, see "[Using environments for deployment](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)."
         *
         * **Note:** GitHub Apps can only review their own custom deployment protection rules.
         * To approve or reject pending deployments that are waiting for review from a specific person or team, see [`POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments`](/rest/actions/workflow-runs#review-pending-deployments-for-a-workflow-run).
         *
         * GitHub Apps must have read and write permission for **Deployments** to use this endpoint.
         */
        reviewCustomGatesForRun: {
            (params?: RestEndpointMethodTypes["actions"]["reviewCustomGatesForRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["reviewCustomGatesForRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Approve or reject pending deployments that are waiting on approval by a required reviewer.
         *
         * Required reviewers with read access to the repository contents and deployments can use this endpoint. Required reviewers must authenticate using an access token with the `repo` scope to use this endpoint.
         */
        reviewPendingDeploymentsForRun: {
            (params?: RestEndpointMethodTypes["actions"]["reviewPendingDeploymentsForRun"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["reviewPendingDeploymentsForRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sets the actions and reusable workflows that are allowed in an organization. To use this endpoint, the organization permission policy for `allowed_actions` must be configured to `selected`. For more information, see "[Set GitHub Actions permissions for an organization](#set-github-actions-permissions-for-an-organization)."
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `administration` organization permission to use this API.
         */
        setAllowedActionsOrganization: {
            (params?: RestEndpointMethodTypes["actions"]["setAllowedActionsOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setAllowedActionsOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sets the actions and reusable workflows that are allowed in a repository. To use this endpoint, the repository permission policy for `allowed_actions` must be configured to `selected`. For more information, see "[Set GitHub Actions permissions for a repository](#set-github-actions-permissions-for-a-repository)."
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `administration` repository permission to use this API.
         */
        setAllowedActionsRepository: {
            (params?: RestEndpointMethodTypes["actions"]["setAllowedActionsRepository"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setAllowedActionsRepository"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Remove all previous custom labels and set the new custom labels for a specific
         * self-hosted runner configured in an organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        setCustomLabelsForSelfHostedRunnerForOrg: {
            (params?: RestEndpointMethodTypes["actions"]["setCustomLabelsForSelfHostedRunnerForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setCustomLabelsForSelfHostedRunnerForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Remove all previous custom labels and set the new custom labels for a specific
         * self-hosted runner configured in a repository.
         *
         * You must authenticate using an access token with the `repo` scope to use this
         * endpoint.
         */
        setCustomLabelsForSelfHostedRunnerForRepo: {
            (params?: RestEndpointMethodTypes["actions"]["setCustomLabelsForSelfHostedRunnerForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setCustomLabelsForSelfHostedRunnerForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sets the default workflow permissions granted to the `GITHUB_TOKEN` when running workflows in an organization, and sets if GitHub Actions
         * can submit approving pull request reviews. For more information, see
         * "[Setting the permissions of the GITHUB_TOKEN for your organization](https://docs.github.com/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#setting-the-permissions-of-the-github_token-for-your-organization)."
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `administration` organization permission to use this API.
         */
        setGithubActionsDefaultWorkflowPermissionsOrganization: {
            (params?: RestEndpointMethodTypes["actions"]["setGithubActionsDefaultWorkflowPermissionsOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setGithubActionsDefaultWorkflowPermissionsOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sets the default workflow permissions granted to the `GITHUB_TOKEN` when running workflows in a repository, and sets if GitHub Actions
         * can submit approving pull request reviews.
         * For more information, see "[Setting the permissions of the GITHUB_TOKEN for your repository](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#setting-the-permissions-of-the-github_token-for-your-repository)."
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the repository `administration` permission to use this API.
         */
        setGithubActionsDefaultWorkflowPermissionsRepository: {
            (params?: RestEndpointMethodTypes["actions"]["setGithubActionsDefaultWorkflowPermissionsRepository"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setGithubActionsDefaultWorkflowPermissionsRepository"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sets the GitHub Actions permissions policy for repositories and allowed actions and reusable workflows in an organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `administration` organization permission to use this API.
         */
        setGithubActionsPermissionsOrganization: {
            (params?: RestEndpointMethodTypes["actions"]["setGithubActionsPermissionsOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setGithubActionsPermissionsOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sets the GitHub Actions permissions policy for enabling GitHub Actions and allowed actions and reusable workflows in the repository.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `administration` repository permission to use this API.
         */
        setGithubActionsPermissionsRepository: {
            (params?: RestEndpointMethodTypes["actions"]["setGithubActionsPermissionsRepository"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setGithubActionsPermissionsRepository"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Replaces all repositories for an organization secret when the `visibility` for repository access is set to `selected`. The visibility is set when you [Create or update an organization secret](https://docs.github.com/rest/reference/actions#create-or-update-an-organization-secret). You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `secrets` organization permission to use this endpoint.
         */
        setSelectedReposForOrgSecret: {
            (params?: RestEndpointMethodTypes["actions"]["setSelectedReposForOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setSelectedReposForOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Replaces all repositories for an organization variable that is available to selected repositories. Organization variables that are available to selected repositories have their `visibility` field set to `selected`. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `organization_actions_variables:write` organization permission to use this endpoint.
         */
        setSelectedReposForOrgVariable: {
            (params?: RestEndpointMethodTypes["actions"]["setSelectedReposForOrgVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setSelectedReposForOrgVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sets the repositories for a required workflow that is required for selected repositories.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         *
         * For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        setSelectedReposToRequiredWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["setSelectedReposToRequiredWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setSelectedReposToRequiredWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Replaces the list of selected repositories that are enabled for GitHub Actions in an organization. To use this endpoint, the organization permission policy for `enabled_repositories` must be configured to `selected`. For more information, see "[Set GitHub Actions permissions for an organization](#set-github-actions-permissions-for-an-organization)."
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `administration` organization permission to use this API.
         */
        setSelectedRepositoriesEnabledGithubActionsOrganization: {
            (params?: RestEndpointMethodTypes["actions"]["setSelectedRepositoriesEnabledGithubActionsOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setSelectedRepositoriesEnabledGithubActionsOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sets the level of access that workflows outside of the repository have to actions and reusable workflows in the repository.
         * This endpoint only applies to private repositories.
         * For more information, see "[Allowing access to components in a private repository](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#allowing-access-to-components-in-a-private-repository)".
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the
         * repository `administration` permission to use this endpoint.
         */
        setWorkflowAccessToRepository: {
            (params?: RestEndpointMethodTypes["actions"]["setWorkflowAccessToRepository"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["setWorkflowAccessToRepository"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates an environment variable that you can reference in a GitHub Actions workflow.
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         * GitHub Apps must have the `environment:write` repository permission to use this endpoint.
         */
        updateEnvironmentVariable: {
            (params?: RestEndpointMethodTypes["actions"]["updateEnvironmentVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["updateEnvironmentVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates an organization variable that you can reference in a GitHub Actions workflow.
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         * GitHub Apps must have the `organization_actions_variables:write` organization permission to use this endpoint.
         */
        updateOrgVariable: {
            (params?: RestEndpointMethodTypes["actions"]["updateOrgVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["updateOrgVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates a repository variable that you can reference in a GitHub Actions workflow.
         * You must authenticate using an access token with the `repo` scope to use this endpoint.
         * GitHub Apps must have the `actions_variables:write` repository permission to use this endpoint.
         */
        updateRepoVariable: {
            (params?: RestEndpointMethodTypes["actions"]["updateRepoVariable"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["updateRepoVariable"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Update a required workflow in an organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         *
         * For more information, see "[Required Workflows](https://docs.github.com/actions/using-workflows/required-workflows)."
         */
        updateRequiredWorkflow: {
            (params?: RestEndpointMethodTypes["actions"]["updateRequiredWorkflow"]["parameters"]): Promise<RestEndpointMethodTypes["actions"]["updateRequiredWorkflow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    activity: {
        checkRepoIsStarredByAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["activity"]["checkRepoIsStarredByAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["checkRepoIsStarredByAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This endpoint should only be used to stop watching a repository. To control whether or not you wish to receive notifications from a repository, [set the repository's subscription manually](https://docs.github.com/rest/reference/activity#set-a-repository-subscription).
         */
        deleteRepoSubscription: {
            (params?: RestEndpointMethodTypes["activity"]["deleteRepoSubscription"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["deleteRepoSubscription"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Mutes all future notifications for a conversation until you comment on the thread or get an **@mention**. If you are watching the repository of the thread, you will still receive notifications. To ignore future notifications for a repository you are watching, use the [Set a thread subscription](https://docs.github.com/rest/reference/activity#set-a-thread-subscription) endpoint and set `ignore` to `true`.
         */
        deleteThreadSubscription: {
            (params?: RestEndpointMethodTypes["activity"]["deleteThreadSubscription"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["deleteThreadSubscription"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * GitHub provides several timeline resources in [Atom](http://en.wikipedia.org/wiki/Atom_(standard)) format. The Feeds API lists all the feeds available to the authenticated user:
         *
         * *   **Timeline**: The GitHub global public timeline
         * *   **User**: The public timeline for any user, using [URI template](https://docs.github.com/rest/overview/resources-in-the-rest-api#hypermedia)
         * *   **Current user public**: The public timeline for the authenticated user
         * *   **Current user**: The private timeline for the authenticated user
         * *   **Current user actor**: The private timeline for activity created by the authenticated user
         * *   **Current user organizations**: The private timeline for the organizations the authenticated user is a member of.
         * *   **Security advisories**: A collection of public announcements that provide information about security-related vulnerabilities in software on GitHub.
         *
         * **Note**: Private feeds are only returned when [authenticating via Basic Auth](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) since current feed URIs use the older, non revocable auth tokens.
         */
        getFeeds: {
            (params?: RestEndpointMethodTypes["activity"]["getFeeds"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["getFeeds"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        getRepoSubscription: {
            (params?: RestEndpointMethodTypes["activity"]["getRepoSubscription"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["getRepoSubscription"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets information about a notification thread.
         */
        getThread: {
            (params?: RestEndpointMethodTypes["activity"]["getThread"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["getThread"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This checks to see if the current user is subscribed to a thread. You can also [get a repository subscription](https://docs.github.com/rest/reference/activity#get-a-repository-subscription).
         *
         * Note that subscriptions are only generated if a user is participating in a conversation--for example, they've replied to the thread, were **@mentioned**, or manually subscribe to a thread.
         */
        getThreadSubscriptionForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["activity"]["getThreadSubscriptionForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["getThreadSubscriptionForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * If you are authenticated as the given user, you will see your private events. Otherwise, you'll only see public events.
         */
        listEventsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["activity"]["listEventsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listEventsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all notifications for the current user, sorted by most recently updated.
         */
        listNotificationsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["activity"]["listNotificationsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listNotificationsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This is the user's organization dashboard. You must be authenticated as the user to view this.
         */
        listOrgEventsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["activity"]["listOrgEventsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listOrgEventsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * We delay the public events feed by five minutes, which means the most recent event returned by the public events API actually occurred at least five minutes ago.
         */
        listPublicEvents: {
            (params?: RestEndpointMethodTypes["activity"]["listPublicEvents"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listPublicEvents"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listPublicEventsForRepoNetwork: {
            (params?: RestEndpointMethodTypes["activity"]["listPublicEventsForRepoNetwork"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listPublicEventsForRepoNetwork"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listPublicEventsForUser: {
            (params?: RestEndpointMethodTypes["activity"]["listPublicEventsForUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listPublicEventsForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listPublicOrgEvents: {
            (params?: RestEndpointMethodTypes["activity"]["listPublicOrgEvents"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listPublicOrgEvents"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * These are events that you've received by watching repos and following users. If you are authenticated as the given user, you will see private events. Otherwise, you'll only see public events.
         */
        listReceivedEventsForUser: {
            (params?: RestEndpointMethodTypes["activity"]["listReceivedEventsForUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listReceivedEventsForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listReceivedPublicEventsForUser: {
            (params?: RestEndpointMethodTypes["activity"]["listReceivedPublicEventsForUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listReceivedPublicEventsForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note**: This API is not built to serve real-time use cases. Depending on the time of day, event latency can be anywhere from 30s to 6h.
         */
        listRepoEvents: {
            (params?: RestEndpointMethodTypes["activity"]["listRepoEvents"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listRepoEvents"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all notifications for the current user in the specified repository.
         */
        listRepoNotificationsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["activity"]["listRepoNotificationsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listRepoNotificationsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists repositories the authenticated user has starred.
         *
         * You can also find out _when_ stars were created by passing the following custom [media type](https://docs.github.com/rest/overview/media-types/) via the `Accept` header: `application/vnd.github.star+json`.
         */
        listReposStarredByAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["activity"]["listReposStarredByAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listReposStarredByAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists repositories a user has starred.
         *
         * You can also find out _when_ stars were created by passing the following custom [media type](https://docs.github.com/rest/overview/media-types/) via the `Accept` header: `application/vnd.github.star+json`.
         */
        listReposStarredByUser: {
            (params?: RestEndpointMethodTypes["activity"]["listReposStarredByUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listReposStarredByUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists repositories a user is watching.
         */
        listReposWatchedByUser: {
            (params?: RestEndpointMethodTypes["activity"]["listReposWatchedByUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listReposWatchedByUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the people that have starred the repository.
         *
         * You can also find out _when_ stars were created by passing the following custom [media type](https://docs.github.com/rest/overview/media-types/) via the `Accept` header: `application/vnd.github.star+json`.
         */
        listStargazersForRepo: {
            (params?: RestEndpointMethodTypes["activity"]["listStargazersForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listStargazersForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists repositories the authenticated user is watching.
         */
        listWatchedReposForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["activity"]["listWatchedReposForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listWatchedReposForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the people watching the specified repository.
         */
        listWatchersForRepo: {
            (params?: RestEndpointMethodTypes["activity"]["listWatchersForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["listWatchersForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Marks all notifications as "read" for the current user. If the number of notifications is too large to complete in one request, you will receive a `202 Accepted` status and GitHub will run an asynchronous process to mark notifications as "read." To check whether any "unread" notifications remain, you can use the [List notifications for the authenticated user](https://docs.github.com/rest/reference/activity#list-notifications-for-the-authenticated-user) endpoint and pass the query parameter `all=false`.
         */
        markNotificationsAsRead: {
            (params?: RestEndpointMethodTypes["activity"]["markNotificationsAsRead"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["markNotificationsAsRead"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Marks all notifications in a repository as "read" for the current user. If the number of notifications is too large to complete in one request, you will receive a `202 Accepted` status and GitHub will run an asynchronous process to mark notifications as "read." To check whether any "unread" notifications remain, you can use the [List repository notifications for the authenticated user](https://docs.github.com/rest/reference/activity#list-repository-notifications-for-the-authenticated-user) endpoint and pass the query parameter `all=false`.
         */
        markRepoNotificationsAsRead: {
            (params?: RestEndpointMethodTypes["activity"]["markRepoNotificationsAsRead"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["markRepoNotificationsAsRead"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Marks a thread as "read." Marking a thread as "read" is equivalent to clicking a notification in your notification inbox on GitHub: https://github.com/notifications.
         */
        markThreadAsRead: {
            (params?: RestEndpointMethodTypes["activity"]["markThreadAsRead"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["markThreadAsRead"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * If you would like to watch a repository, set `subscribed` to `true`. If you would like to ignore notifications made within a repository, set `ignored` to `true`. If you would like to stop watching a repository, [delete the repository's subscription](https://docs.github.com/rest/reference/activity#delete-a-repository-subscription) completely.
         */
        setRepoSubscription: {
            (params?: RestEndpointMethodTypes["activity"]["setRepoSubscription"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["setRepoSubscription"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * If you are watching a repository, you receive notifications for all threads by default. Use this endpoint to ignore future notifications for threads until you comment on the thread or get an **@mention**.
         *
         * You can also use this endpoint to subscribe to threads that you are currently not receiving notifications for or to subscribed to threads that you have previously ignored.
         *
         * Unsubscribing from a conversation in a repository that you are not watching is functionally equivalent to the [Delete a thread subscription](https://docs.github.com/rest/reference/activity#delete-a-thread-subscription) endpoint.
         */
        setThreadSubscription: {
            (params?: RestEndpointMethodTypes["activity"]["setThreadSubscription"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["setThreadSubscription"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Note that you'll need to set `Content-Length` to zero when calling out to this endpoint. For more information, see "[HTTP verbs](https://docs.github.com/rest/overview/resources-in-the-rest-api#http-verbs)."
         */
        starRepoForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["activity"]["starRepoForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["starRepoForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        unstarRepoForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["activity"]["unstarRepoForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["activity"]["unstarRepoForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    apps: {
        /**
         * Add a single repository to an installation. The authenticated user must have admin access to the repository.
         *
         * You must use a personal access token (which you can create via the [command line](https://docs.github.com/github/authenticating-to-github/creating-a-personal-access-token) or [Basic Authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication)) to access this endpoint.
         * @deprecated octokit.rest.apps.addRepoToInstallation() has been renamed to octokit.rest.apps.addRepoToInstallationForAuthenticatedUser() (2021-10-05)
         */
        addRepoToInstallation: {
            (params?: RestEndpointMethodTypes["apps"]["addRepoToInstallation"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["addRepoToInstallation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Add a single repository to an installation. The authenticated user must have admin access to the repository.
         *
         * You must use a personal access token (which you can create via the [command line](https://docs.github.com/github/authenticating-to-github/creating-a-personal-access-token) or [Basic Authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication)) to access this endpoint.
         */
        addRepoToInstallationForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["apps"]["addRepoToInstallationForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["addRepoToInstallationForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * OAuth applications and GitHub applications with OAuth authorizations can use this API method for checking OAuth token validity without exceeding the normal rate limits for failed login attempts. Authentication works differently with this particular endpoint. You must use [Basic Authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) to use this endpoint, where the username is the application `client_id` and the password is its `client_secret`. Invalid tokens will return `404 NOT FOUND`.
         */
        checkToken: {
            (params?: RestEndpointMethodTypes["apps"]["checkToken"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["checkToken"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Use this endpoint to complete the handshake necessary when implementing the [GitHub App Manifest flow](https://docs.github.com/apps/building-github-apps/creating-github-apps-from-a-manifest/). When you create a GitHub App with the manifest flow, you receive a temporary `code` used to retrieve the GitHub App's `id`, `pem` (private key), and `webhook_secret`.
         */
        createFromManifest: {
            (params?: RestEndpointMethodTypes["apps"]["createFromManifest"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["createFromManifest"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates an installation access token that enables a GitHub App to make authenticated API requests for the app's installation on an organization or individual account. Installation tokens expire one hour from the time you create them. Using an expired token produces a status code of `401 - Unauthorized`, and requires creating a new installation token. By default the installation token has access to all repositories that the installation can access. To restrict the access to specific repositories, you can provide the `repository_ids` when creating the token. When you omit `repository_ids`, the response does not contain the `repositories` key.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        createInstallationAccessToken: {
            (params?: RestEndpointMethodTypes["apps"]["createInstallationAccessToken"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["createInstallationAccessToken"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * OAuth and GitHub application owners can revoke a grant for their application and a specific user. You must use [Basic Authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) when accessing this endpoint, using the OAuth application's `client_id` and `client_secret` as the username and password. You must also provide a valid OAuth `access_token` as an input parameter and the grant for the token's owner will be deleted.
         * Deleting an application's grant will also delete all OAuth tokens associated with the application for the user. Once deleted, the application will have no access to the user's account and will no longer be listed on [the application authorizations settings screen within GitHub](https://github.com/settings/applications#authorized).
         */
        deleteAuthorization: {
            (params?: RestEndpointMethodTypes["apps"]["deleteAuthorization"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["deleteAuthorization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Uninstalls a GitHub App on a user, organization, or business account. If you prefer to temporarily suspend an app's access to your account's resources, then we recommend the "[Suspend an app installation](https://docs.github.com/rest/reference/apps/#suspend-an-app-installation)" endpoint.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        deleteInstallation: {
            (params?: RestEndpointMethodTypes["apps"]["deleteInstallation"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["deleteInstallation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * OAuth  or GitHub application owners can revoke a single token for an OAuth application or a GitHub application with an OAuth authorization. You must use [Basic Authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) when accessing this endpoint, using the application's `client_id` and `client_secret` as the username and password.
         */
        deleteToken: {
            (params?: RestEndpointMethodTypes["apps"]["deleteToken"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["deleteToken"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns the GitHub App associated with the authentication credentials used. To see how many app installations are associated with this GitHub App, see the `installations_count` in the response. For more details about your app's installations, see the "[List installations for the authenticated app](https://docs.github.com/rest/reference/apps#list-installations-for-the-authenticated-app)" endpoint.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        getAuthenticated: {
            (params?: RestEndpointMethodTypes["apps"]["getAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["getAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note**: The `:app_slug` is just the URL-friendly name of your GitHub App. You can find this on the settings page for your GitHub App (e.g., `https://github.com/settings/apps/:app_slug`).
         *
         * If the GitHub App you specify is public, you can access this endpoint without authenticating. If the GitHub App you specify is private, you must authenticate with a [personal access token](https://docs.github.com/articles/creating-a-personal-access-token-for-the-command-line/) or an [installation access token](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-an-installation) to access this endpoint.
         */
        getBySlug: {
            (params?: RestEndpointMethodTypes["apps"]["getBySlug"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["getBySlug"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Enables an authenticated GitHub App to find an installation's information using the installation id.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        getInstallation: {
            (params?: RestEndpointMethodTypes["apps"]["getInstallation"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["getInstallation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Enables an authenticated GitHub App to find the organization's installation information.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        getOrgInstallation: {
            (params?: RestEndpointMethodTypes["apps"]["getOrgInstallation"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["getOrgInstallation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Enables an authenticated GitHub App to find the repository's installation information. The installation's account type will be either an organization or a user account, depending which account the repository belongs to.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        getRepoInstallation: {
            (params?: RestEndpointMethodTypes["apps"]["getRepoInstallation"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["getRepoInstallation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Shows whether the user or organization account actively subscribes to a plan listed by the authenticated GitHub App. When someone submits a plan change that won't be processed until the end of their billing cycle, you will also see the upcoming pending change.
         *
         * GitHub Apps must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint. OAuth Apps must use [basic authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) with their client ID and client secret to access this endpoint.
         */
        getSubscriptionPlanForAccount: {
            (params?: RestEndpointMethodTypes["apps"]["getSubscriptionPlanForAccount"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["getSubscriptionPlanForAccount"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Shows whether the user or organization account actively subscribes to a plan listed by the authenticated GitHub App. When someone submits a plan change that won't be processed until the end of their billing cycle, you will also see the upcoming pending change.
         *
         * GitHub Apps must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint. OAuth Apps must use [basic authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) with their client ID and client secret to access this endpoint.
         */
        getSubscriptionPlanForAccountStubbed: {
            (params?: RestEndpointMethodTypes["apps"]["getSubscriptionPlanForAccountStubbed"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["getSubscriptionPlanForAccountStubbed"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Enables an authenticated GitHub App to find the user’s installation information.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        getUserInstallation: {
            (params?: RestEndpointMethodTypes["apps"]["getUserInstallation"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["getUserInstallation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns the webhook configuration for a GitHub App. For more information about configuring a webhook for your app, see "[Creating a GitHub App](/developers/apps/creating-a-github-app)."
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        getWebhookConfigForApp: {
            (params?: RestEndpointMethodTypes["apps"]["getWebhookConfigForApp"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["getWebhookConfigForApp"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a delivery for the webhook configured for a GitHub App.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        getWebhookDelivery: {
            (params?: RestEndpointMethodTypes["apps"]["getWebhookDelivery"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["getWebhookDelivery"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns user and organization accounts associated with the specified plan, including free plans. For per-seat pricing, you see the list of accounts that have purchased the plan, including the number of seats purchased. When someone submits a plan change that won't be processed until the end of their billing cycle, you will also see the upcoming pending change.
         *
         * GitHub Apps must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint. OAuth Apps must use [basic authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) with their client ID and client secret to access this endpoint.
         */
        listAccountsForPlan: {
            (params?: RestEndpointMethodTypes["apps"]["listAccountsForPlan"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listAccountsForPlan"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns repository and organization accounts associated with the specified plan, including free plans. For per-seat pricing, you see the list of accounts that have purchased the plan, including the number of seats purchased. When someone submits a plan change that won't be processed until the end of their billing cycle, you will also see the upcoming pending change.
         *
         * GitHub Apps must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint. OAuth Apps must use [basic authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) with their client ID and client secret to access this endpoint.
         */
        listAccountsForPlanStubbed: {
            (params?: RestEndpointMethodTypes["apps"]["listAccountsForPlanStubbed"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listAccountsForPlanStubbed"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List repositories that the authenticated user has explicit permission (`:read`, `:write`, or `:admin`) to access for an installation.
         *
         * The authenticated user has explicit permission to access repositories they own, repositories where they are a collaborator, and repositories that they can access through an organization membership.
         *
         * You must use a [user-to-server OAuth access token](https://docs.github.com/apps/building-github-apps/identifying-and-authorizing-users-for-github-apps/#identifying-users-on-your-site), created for a user who has authorized your GitHub App, to access this endpoint.
         *
         * The access the user has to each repository is included in the hash under the `permissions` key.
         */
        listInstallationReposForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["apps"]["listInstallationReposForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listInstallationReposForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all the pending installation requests for the authenticated GitHub App.
         */
        listInstallationRequestsForAuthenticatedApp: {
            (params?: RestEndpointMethodTypes["apps"]["listInstallationRequestsForAuthenticatedApp"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listInstallationRequestsForAuthenticatedApp"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         *
         * The permissions the installation has are included under the `permissions` key.
         */
        listInstallations: {
            (params?: RestEndpointMethodTypes["apps"]["listInstallations"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listInstallations"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists installations of your GitHub App that the authenticated user has explicit permission (`:read`, `:write`, or `:admin`) to access.
         *
         * You must use a [user-to-server OAuth access token](https://docs.github.com/apps/building-github-apps/identifying-and-authorizing-users-for-github-apps/#identifying-users-on-your-site), created for a user who has authorized your GitHub App, to access this endpoint.
         *
         * The authenticated user has explicit permission to access repositories they own, repositories where they are a collaborator, and repositories that they can access through an organization membership.
         *
         * You can find the permissions for the installation under the `permissions` key.
         */
        listInstallationsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["apps"]["listInstallationsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listInstallationsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all plans that are part of your GitHub Marketplace listing.
         *
         * GitHub Apps must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint. OAuth Apps must use [basic authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) with their client ID and client secret to access this endpoint.
         */
        listPlans: {
            (params?: RestEndpointMethodTypes["apps"]["listPlans"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listPlans"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all plans that are part of your GitHub Marketplace listing.
         *
         * GitHub Apps must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint. OAuth Apps must use [basic authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) with their client ID and client secret to access this endpoint.
         */
        listPlansStubbed: {
            (params?: RestEndpointMethodTypes["apps"]["listPlansStubbed"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listPlansStubbed"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List repositories that an app installation can access.
         *
         * You must use an [installation access token](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-an-installation) to access this endpoint.
         */
        listReposAccessibleToInstallation: {
            (params?: RestEndpointMethodTypes["apps"]["listReposAccessibleToInstallation"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listReposAccessibleToInstallation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the active subscriptions for the authenticated user. You must use a [user-to-server OAuth access token](https://docs.github.com/apps/building-github-apps/identifying-and-authorizing-users-for-github-apps/#identifying-users-on-your-site), created for a user who has authorized your GitHub App, to access this endpoint. . OAuth Apps must authenticate using an [OAuth token](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/).
         */
        listSubscriptionsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["apps"]["listSubscriptionsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listSubscriptionsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the active subscriptions for the authenticated user. You must use a [user-to-server OAuth access token](https://docs.github.com/apps/building-github-apps/identifying-and-authorizing-users-for-github-apps/#identifying-users-on-your-site), created for a user who has authorized your GitHub App, to access this endpoint. . OAuth Apps must authenticate using an [OAuth token](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/).
         */
        listSubscriptionsForAuthenticatedUserStubbed: {
            (params?: RestEndpointMethodTypes["apps"]["listSubscriptionsForAuthenticatedUserStubbed"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listSubscriptionsForAuthenticatedUserStubbed"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a list of webhook deliveries for the webhook configured for a GitHub App.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        listWebhookDeliveries: {
            (params?: RestEndpointMethodTypes["apps"]["listWebhookDeliveries"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["listWebhookDeliveries"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Redeliver a delivery for the webhook configured for a GitHub App.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        redeliverWebhookDelivery: {
            (params?: RestEndpointMethodTypes["apps"]["redeliverWebhookDelivery"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["redeliverWebhookDelivery"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Remove a single repository from an installation. The authenticated user must have admin access to the repository. The installation must have the `repository_selection` of `selected`.
         *
         * You must use a personal access token (which you can create via the [command line](https://docs.github.com/github/authenticating-to-github/creating-a-personal-access-token) or [Basic Authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication)) to access this endpoint.
         * @deprecated octokit.rest.apps.removeRepoFromInstallation() has been renamed to octokit.rest.apps.removeRepoFromInstallationForAuthenticatedUser() (2021-10-05)
         */
        removeRepoFromInstallation: {
            (params?: RestEndpointMethodTypes["apps"]["removeRepoFromInstallation"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["removeRepoFromInstallation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Remove a single repository from an installation. The authenticated user must have admin access to the repository. The installation must have the `repository_selection` of `selected`.
         *
         * You must use a personal access token (which you can create via the [command line](https://docs.github.com/github/authenticating-to-github/creating-a-personal-access-token) or [Basic Authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication)) to access this endpoint.
         */
        removeRepoFromInstallationForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["apps"]["removeRepoFromInstallationForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["removeRepoFromInstallationForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * OAuth applications and GitHub applications with OAuth authorizations can use this API method to reset a valid OAuth token without end-user involvement. Applications must save the "token" property in the response because changes take effect immediately. You must use [Basic Authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) when accessing this endpoint, using the application's `client_id` and `client_secret` as the username and password. Invalid tokens will return `404 NOT FOUND`.
         */
        resetToken: {
            (params?: RestEndpointMethodTypes["apps"]["resetToken"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["resetToken"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Revokes the installation token you're using to authenticate as an installation and access this endpoint.
         *
         * Once an installation token is revoked, the token is invalidated and cannot be used. Other endpoints that require the revoked installation token must have a new installation token to work. You can create a new token using the "[Create an installation access token for an app](https://docs.github.com/rest/reference/apps#create-an-installation-access-token-for-an-app)" endpoint.
         *
         * You must use an [installation access token](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-an-installation) to access this endpoint.
         */
        revokeInstallationAccessToken: {
            (params?: RestEndpointMethodTypes["apps"]["revokeInstallationAccessToken"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["revokeInstallationAccessToken"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Use a non-scoped user-to-server access token to create a repository scoped and/or permission scoped user-to-server access token. You can specify which repositories the token can access and which permissions are granted to the token. You must use [Basic Authentication](https://docs.github.com/rest/overview/other-authentication-methods#basic-authentication) when accessing this endpoint, using the `client_id` and `client_secret` of the GitHub App as the username and password. Invalid tokens will return `404 NOT FOUND`.
         */
        scopeToken: {
            (params?: RestEndpointMethodTypes["apps"]["scopeToken"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["scopeToken"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Suspends a GitHub App on a user, organization, or business account, which blocks the app from accessing the account's resources. When a GitHub App is suspended, the app's access to the GitHub API or webhook events is blocked for that account.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        suspendInstallation: {
            (params?: RestEndpointMethodTypes["apps"]["suspendInstallation"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["suspendInstallation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a GitHub App installation suspension.
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        unsuspendInstallation: {
            (params?: RestEndpointMethodTypes["apps"]["unsuspendInstallation"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["unsuspendInstallation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates the webhook configuration for a GitHub App. For more information about configuring a webhook for your app, see "[Creating a GitHub App](/developers/apps/creating-a-github-app)."
         *
         * You must use a [JWT](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/#authenticating-as-a-github-app) to access this endpoint.
         */
        updateWebhookConfigForApp: {
            (params?: RestEndpointMethodTypes["apps"]["updateWebhookConfigForApp"]["parameters"]): Promise<RestEndpointMethodTypes["apps"]["updateWebhookConfigForApp"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    billing: {
        /**
         * Gets the summary of the free and paid GitHub Actions minutes used.
         *
         * Paid minutes only apply to workflows in private repositories that use GitHub-hosted runners. Minutes used is listed for each GitHub-hosted runner operating system. Any job re-runs are also included in the usage. The usage returned includes any minute multipliers for macOS and Windows runners, and is rounded up to the nearest whole minute. For more information, see "[Managing billing for GitHub Actions](https://docs.github.com/github/setting-up-and-managing-billing-and-payments-on-github/managing-billing-for-github-actions)".
         *
         * Access tokens must have the `repo` or `admin:org` scope.
         */
        getGithubActionsBillingOrg: {
            (params?: RestEndpointMethodTypes["billing"]["getGithubActionsBillingOrg"]["parameters"]): Promise<RestEndpointMethodTypes["billing"]["getGithubActionsBillingOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the summary of the free and paid GitHub Actions minutes used.
         *
         * Paid minutes only apply to workflows in private repositories that use GitHub-hosted runners. Minutes used is listed for each GitHub-hosted runner operating system. Any job re-runs are also included in the usage. The usage returned includes any minute multipliers for macOS and Windows runners, and is rounded up to the nearest whole minute. For more information, see "[Managing billing for GitHub Actions](https://docs.github.com/github/setting-up-and-managing-billing-and-payments-on-github/managing-billing-for-github-actions)".
         *
         * Access tokens must have the `user` scope.
         */
        getGithubActionsBillingUser: {
            (params?: RestEndpointMethodTypes["billing"]["getGithubActionsBillingUser"]["parameters"]): Promise<RestEndpointMethodTypes["billing"]["getGithubActionsBillingUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the free and paid storage used for GitHub Packages in gigabytes.
         *
         * Paid minutes only apply to packages stored for private repositories. For more information, see "[Managing billing for GitHub Packages](https://docs.github.com/github/setting-up-and-managing-billing-and-payments-on-github/managing-billing-for-github-packages)."
         *
         * Access tokens must have the `repo` or `admin:org` scope.
         */
        getGithubPackagesBillingOrg: {
            (params?: RestEndpointMethodTypes["billing"]["getGithubPackagesBillingOrg"]["parameters"]): Promise<RestEndpointMethodTypes["billing"]["getGithubPackagesBillingOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the free and paid storage used for GitHub Packages in gigabytes.
         *
         * Paid minutes only apply to packages stored for private repositories. For more information, see "[Managing billing for GitHub Packages](https://docs.github.com/github/setting-up-and-managing-billing-and-payments-on-github/managing-billing-for-github-packages)."
         *
         * Access tokens must have the `user` scope.
         */
        getGithubPackagesBillingUser: {
            (params?: RestEndpointMethodTypes["billing"]["getGithubPackagesBillingUser"]["parameters"]): Promise<RestEndpointMethodTypes["billing"]["getGithubPackagesBillingUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the estimated paid and estimated total storage used for GitHub Actions and GitHub Packages.
         *
         * Paid minutes only apply to packages stored for private repositories. For more information, see "[Managing billing for GitHub Packages](https://docs.github.com/github/setting-up-and-managing-billing-and-payments-on-github/managing-billing-for-github-packages)."
         *
         * Access tokens must have the `repo` or `admin:org` scope.
         */
        getSharedStorageBillingOrg: {
            (params?: RestEndpointMethodTypes["billing"]["getSharedStorageBillingOrg"]["parameters"]): Promise<RestEndpointMethodTypes["billing"]["getSharedStorageBillingOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the estimated paid and estimated total storage used for GitHub Actions and GitHub Packages.
         *
         * Paid minutes only apply to packages stored for private repositories. For more information, see "[Managing billing for GitHub Packages](https://docs.github.com/github/setting-up-and-managing-billing-and-payments-on-github/managing-billing-for-github-packages)."
         *
         * Access tokens must have the `user` scope.
         */
        getSharedStorageBillingUser: {
            (params?: RestEndpointMethodTypes["billing"]["getSharedStorageBillingUser"]["parameters"]): Promise<RestEndpointMethodTypes["billing"]["getSharedStorageBillingUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    checks: {
        /**
         * **Note:** The Checks API only looks for pushes in the repository where the check suite or check run were created. Pushes to a branch in a forked repository are not detected and return an empty `pull_requests` array.
         *
         * Creates a new check run for a specific commit in a repository. Your GitHub App must have the `checks:write` permission to create check runs.
         *
         * In a check suite, GitHub limits the number of check runs with the same name to 1000. Once these check runs exceed 1000, GitHub will start to automatically delete older check runs.
         */
        create: {
            (params?: RestEndpointMethodTypes["checks"]["create"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["create"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** The Checks API only looks for pushes in the repository where the check suite or check run were created. Pushes to a branch in a forked repository are not detected and return an empty `pull_requests` array and a `null` value for `head_branch`.
         *
         * By default, check suites are automatically created when you create a [check run](https://docs.github.com/rest/reference/checks#check-runs). You only need to use this endpoint for manually creating check suites when you've disabled automatic creation using "[Update repository preferences for check suites](https://docs.github.com/rest/reference/checks#update-repository-preferences-for-check-suites)". Your GitHub App must have the `checks:write` permission to create check suites.
         */
        createSuite: {
            (params?: RestEndpointMethodTypes["checks"]["createSuite"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["createSuite"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** The Checks API only looks for pushes in the repository where the check suite or check run were created. Pushes to a branch in a forked repository are not detected and return an empty `pull_requests` array.
         *
         * Gets a single check run using its `id`. GitHub Apps must have the `checks:read` permission on a private repository or pull access to a public repository to get check runs. OAuth Apps and authenticated users must have the `repo` scope to get check runs in a private repository.
         */
        get: {
            (params?: RestEndpointMethodTypes["checks"]["get"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["get"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** The Checks API only looks for pushes in the repository where the check suite or check run were created. Pushes to a branch in a forked repository are not detected and return an empty `pull_requests` array and a `null` value for `head_branch`.
         *
         * Gets a single check suite using its `id`. GitHub Apps must have the `checks:read` permission on a private repository or pull access to a public repository to get check suites. OAuth Apps and authenticated users must have the `repo` scope to get check suites in a private repository.
         */
        getSuite: {
            (params?: RestEndpointMethodTypes["checks"]["getSuite"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["getSuite"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists annotations for a check run using the annotation `id`. GitHub Apps must have the `checks:read` permission on a private repository or pull access to a public repository to get annotations for a check run. OAuth Apps and authenticated users must have the `repo` scope to get annotations for a check run in a private repository.
         */
        listAnnotations: {
            (params?: RestEndpointMethodTypes["checks"]["listAnnotations"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["listAnnotations"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** The Checks API only looks for pushes in the repository where the check suite or check run were created. Pushes to a branch in a forked repository are not detected and return an empty `pull_requests` array.
         *
         * Lists check runs for a commit ref. The `ref` can be a SHA, branch name, or a tag name. GitHub Apps must have the `checks:read` permission on a private repository or pull access to a public repository to get check runs. OAuth Apps and authenticated users must have the `repo` scope to get check runs in a private repository.
         */
        listForRef: {
            (params?: RestEndpointMethodTypes["checks"]["listForRef"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["listForRef"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** The Checks API only looks for pushes in the repository where the check suite or check run were created. Pushes to a branch in a forked repository are not detected and return an empty `pull_requests` array.
         *
         * Lists check runs for a check suite using its `id`. GitHub Apps must have the `checks:read` permission on a private repository or pull access to a public repository to get check runs. OAuth Apps and authenticated users must have the `repo` scope to get check runs in a private repository.
         */
        listForSuite: {
            (params?: RestEndpointMethodTypes["checks"]["listForSuite"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["listForSuite"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** The Checks API only looks for pushes in the repository where the check suite or check run were created. Pushes to a branch in a forked repository are not detected and return an empty `pull_requests` array and a `null` value for `head_branch`.
         *
         * Lists check suites for a commit `ref`. The `ref` can be a SHA, branch name, or a tag name. GitHub Apps must have the `checks:read` permission on a private repository or pull access to a public repository to list check suites. OAuth Apps and authenticated users must have the `repo` scope to get check suites in a private repository.
         */
        listSuitesForRef: {
            (params?: RestEndpointMethodTypes["checks"]["listSuitesForRef"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["listSuitesForRef"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Triggers GitHub to rerequest an existing check run, without pushing new code to a repository. This endpoint will trigger the [`check_run` webhook](https://docs.github.com/webhooks/event-payloads/#check_run) event with the action `rerequested`. When a check run is `rerequested`, its `status` is reset to `queued` and the `conclusion` is cleared.
         *
         * To rerequest a check run, your GitHub App must have the `checks:read` permission on a private repository or pull access to a public repository.
         */
        rerequestRun: {
            (params?: RestEndpointMethodTypes["checks"]["rerequestRun"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["rerequestRun"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Triggers GitHub to rerequest an existing check suite, without pushing new code to a repository. This endpoint will trigger the [`check_suite` webhook](https://docs.github.com/webhooks/event-payloads/#check_suite) event with the action `rerequested`. When a check suite is `rerequested`, its `status` is reset to `queued` and the `conclusion` is cleared.
         *
         * To rerequest a check suite, your GitHub App must have the `checks:read` permission on a private repository or pull access to a public repository.
         */
        rerequestSuite: {
            (params?: RestEndpointMethodTypes["checks"]["rerequestSuite"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["rerequestSuite"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Changes the default automatic flow when creating check suites. By default, a check suite is automatically created each time code is pushed to a repository. When you disable the automatic creation of check suites, you can manually [Create a check suite](https://docs.github.com/rest/reference/checks#create-a-check-suite). You must have admin permissions in the repository to set preferences for check suites.
         */
        setSuitesPreferences: {
            (params?: RestEndpointMethodTypes["checks"]["setSuitesPreferences"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["setSuitesPreferences"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** The Checks API only looks for pushes in the repository where the check suite or check run were created. Pushes to a branch in a forked repository are not detected and return an empty `pull_requests` array.
         *
         * Updates a check run for a specific commit in a repository. Your GitHub App must have the `checks:write` permission to edit check runs.
         */
        update: {
            (params?: RestEndpointMethodTypes["checks"]["update"]["parameters"]): Promise<RestEndpointMethodTypes["checks"]["update"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    codeScanning: {
        /**
         * Deletes a specified code scanning analysis from a repository. For
         * private repositories, you must use an access token with the `repo` scope. For public repositories,
         * you must use an access token with `public_repo` scope.
         * GitHub Apps must have the `security_events` write permission to use this endpoint.
         *
         * You can delete one analysis at a time.
         * To delete a series of analyses, start with the most recent analysis and work backwards.
         * Conceptually, the process is similar to the undo function in a text editor.
         *
         * When you list the analyses for a repository,
         * one or more will be identified as deletable in the response:
         *
         * ```
         * "deletable": true
         * ```
         *
         * An analysis is deletable when it's the most recent in a set of analyses.
         * Typically, a repository will have multiple sets of analyses
         * for each enabled code scanning tool,
         * where a set is determined by a unique combination of analysis values:
         *
         * * `ref`
         * * `tool`
         * * `category`
         *
         * If you attempt to delete an analysis that is not the most recent in a set,
         * you'll get a 400 response with the message:
         *
         * ```
         * Analysis specified is not deletable.
         * ```
         *
         * The response from a successful `DELETE` operation provides you with
         * two alternative URLs for deleting the next analysis in the set:
         * `next_analysis_url` and `confirm_delete_url`.
         * Use the `next_analysis_url` URL if you want to avoid accidentally deleting the final analysis
         * in a set. This is a useful option if you want to preserve at least one analysis
         * for the specified tool in your repository.
         * Use the `confirm_delete_url` URL if you are content to remove all analyses for a tool.
         * When you delete the last analysis in a set, the value of `next_analysis_url` and `confirm_delete_url`
         * in the 200 response is `null`.
         *
         * As an example of the deletion process,
         * let's imagine that you added a workflow that configured a particular code scanning tool
         * to analyze the code in a repository. This tool has added 15 analyses:
         * 10 on the default branch, and another 5 on a topic branch.
         * You therefore have two separate sets of analyses for this tool.
         * You've now decided that you want to remove all of the analyses for the tool.
         * To do this you must make 15 separate deletion requests.
         * To start, you must find an analysis that's identified as deletable.
         * Each set of analyses always has one that's identified as deletable.
         * Having found the deletable analysis for one of the two sets,
         * delete this analysis and then continue deleting the next analysis in the set until they're all deleted.
         * Then repeat the process for the second set.
         * The procedure therefore consists of a nested loop:
         *
         * **Outer loop**:
         * * List the analyses for the repository, filtered by tool.
         * * Parse this list to find a deletable analysis. If found:
         *
         *   **Inner loop**:
         *   * Delete the identified analysis.
         *   * Parse the response for the value of `confirm_delete_url` and, if found, use this in the next iteration.
         *
         * The above process assumes that you want to remove all trace of the tool's analyses from the GitHub user interface, for the specified repository, and it therefore uses the `confirm_delete_url` value. Alternatively, you could use the `next_analysis_url` value, which would leave the last analysis in each set undeleted to avoid removing a tool's analysis entirely.
         */
        deleteAnalysis: {
            (params?: RestEndpointMethodTypes["codeScanning"]["deleteAnalysis"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["deleteAnalysis"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a single code scanning alert. You must use an access token with the `security_events` scope to use this endpoint with private repos, the `public_repo` scope also grants permission to read security events on public repos only. GitHub Apps must have the `security_events` read permission to use this endpoint.
         */
        getAlert: {
            (params?: RestEndpointMethodTypes["codeScanning"]["getAlert"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["getAlert"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specified code scanning analysis for a repository.
         * You must use an access token with the `security_events` scope to use this endpoint with private repos,
         * the `public_repo` scope also grants permission to read security events on public repos only.
         * GitHub Apps must have the `security_events` read permission to use this endpoint.
         *
         * The default JSON response contains fields that describe the analysis.
         * This includes the Git reference and commit SHA to which the analysis relates,
         * the datetime of the analysis, the name of the code scanning tool,
         * and the number of alerts.
         *
         * The `rules_count` field in the default response give the number of rules
         * that were run in the analysis.
         * For very old analyses this data is not available,
         * and `0` is returned in this field.
         *
         * If you use the Accept header `application/sarif+json`,
         * the response contains the analysis data that was uploaded.
         * This is formatted as
         * [SARIF version 2.1.0](https://docs.oasis-open.org/sarif/sarif/v2.1.0/cs01/sarif-v2.1.0-cs01.html).
         */
        getAnalysis: {
            (params?: RestEndpointMethodTypes["codeScanning"]["getAnalysis"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["getAnalysis"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a CodeQL database for a language in a repository.
         *
         * By default this endpoint returns JSON metadata about the CodeQL database. To
         * download the CodeQL database binary content, set the `Accept` header of the request
         * to [`application/zip`](https://docs.github.com/rest/overview/media-types), and make sure
         * your HTTP client is configured to follow redirects or use the `Location` header
         * to make a second request to get the redirect URL.
         *
         * For private repositories, you must use an access token with the `security_events` scope.
         * For public repositories, you can use tokens with the `security_events` or `public_repo` scope.
         * GitHub Apps must have the `contents` read permission to use this endpoint.
         */
        getCodeqlDatabase: {
            (params?: RestEndpointMethodTypes["codeScanning"]["getCodeqlDatabase"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["getCodeqlDatabase"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a code scanning default setup configuration.
         * You must use an access token with the `repo` scope to use this endpoint with private repos or the `public_repo`
         * scope for public repos. GitHub Apps must have the `repo` write permission to use this endpoint.
         */
        getDefaultSetup: {
            (params?: RestEndpointMethodTypes["codeScanning"]["getDefaultSetup"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["getDefaultSetup"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets information about a SARIF upload, including the status and the URL of the analysis that was uploaded so that you can retrieve details of the analysis. For more information, see "[Get a code scanning analysis for a repository](/rest/reference/code-scanning#get-a-code-scanning-analysis-for-a-repository)." You must use an access token with the `security_events` scope to use this endpoint with private repos, the `public_repo` scope also grants permission to read security events on public repos only. GitHub Apps must have the `security_events` read permission to use this endpoint.
         */
        getSarif: {
            (params?: RestEndpointMethodTypes["codeScanning"]["getSarif"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["getSarif"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all instances of the specified code scanning alert.
         * You must use an access token with the `security_events` scope to use this endpoint with private repos,
         * the `public_repo` scope also grants permission to read security events on public repos only.
         * GitHub Apps must have the `security_events` read permission to use this endpoint.
         */
        listAlertInstances: {
            (params?: RestEndpointMethodTypes["codeScanning"]["listAlertInstances"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["listAlertInstances"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists code scanning alerts for the default branch for all eligible repositories in an organization. Eligible repositories are repositories that are owned by organizations that you own or for which you are a security manager. For more information, see "[Managing security managers in your organization](https://docs.github.com/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization)."
         *
         * To use this endpoint, you must be an owner or security manager for the organization, and you must use an access token with the `repo` scope or `security_events` scope.
         *
         * For public repositories, you may instead use the `public_repo` scope.
         *
         * GitHub Apps must have the `security_events` read permission to use this endpoint.
         */
        listAlertsForOrg: {
            (params?: RestEndpointMethodTypes["codeScanning"]["listAlertsForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["listAlertsForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all open code scanning alerts for the default branch (usually `main`
         * or `master`). You must use an access token with the `security_events` scope to use
         * this endpoint with private repos, the `public_repo` scope also grants permission to read
         * security events on public repos only. GitHub Apps must have the `security_events` read
         * permission to use this endpoint.
         *
         * The response includes a `most_recent_instance` object.
         * This provides details of the most recent instance of this alert
         * for the default branch or for the specified Git reference
         * (if you used `ref` in the request).
         */
        listAlertsForRepo: {
            (params?: RestEndpointMethodTypes["codeScanning"]["listAlertsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["listAlertsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all instances of the specified code scanning alert.
         * You must use an access token with the `security_events` scope to use this endpoint with private repos,
         * the `public_repo` scope also grants permission to read security events on public repos only.
         * GitHub Apps must have the `security_events` read permission to use this endpoint.
         * @deprecated octokit.rest.codeScanning.listAlertsInstances() has been renamed to octokit.rest.codeScanning.listAlertInstances() (2021-04-30)
         */
        listAlertsInstances: {
            (params?: RestEndpointMethodTypes["codeScanning"]["listAlertsInstances"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["listAlertsInstances"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the CodeQL databases that are available in a repository.
         *
         * For private repositories, you must use an access token with the `security_events` scope.
         * For public repositories, you can use tokens with the `security_events` or `public_repo` scope.
         * GitHub Apps must have the `contents` read permission to use this endpoint.
         */
        listCodeqlDatabases: {
            (params?: RestEndpointMethodTypes["codeScanning"]["listCodeqlDatabases"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["listCodeqlDatabases"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the details of all code scanning analyses for a repository,
         * starting with the most recent.
         * The response is paginated and you can use the `page` and `per_page` parameters
         * to list the analyses you're interested in.
         * By default 30 analyses are listed per page.
         *
         * The `rules_count` field in the response give the number of rules
         * that were run in the analysis.
         * For very old analyses this data is not available,
         * and `0` is returned in this field.
         *
         * You must use an access token with the `security_events` scope to use this endpoint with private repos,
         * the `public_repo` scope also grants permission to read security events on public repos only.
         * GitHub Apps must have the `security_events` read permission to use this endpoint.
         *
         * **Deprecation notice**:
         * The `tool_name` field is deprecated and will, in future, not be included in the response for this endpoint. The example response reflects this change. The tool name can now be found inside the `tool` field.
         */
        listRecentAnalyses: {
            (params?: RestEndpointMethodTypes["codeScanning"]["listRecentAnalyses"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["listRecentAnalyses"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates the status of a single code scanning alert. You must use an access token with the `security_events` scope to use this endpoint with private repositories. You can also use tokens with the `public_repo` scope for public repositories only. GitHub Apps must have the `security_events` write permission to use this endpoint.
         */
        updateAlert: {
            (params?: RestEndpointMethodTypes["codeScanning"]["updateAlert"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["updateAlert"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates a code scanning default setup configuration.
         * You must use an access token with the `repo` scope to use this endpoint with private repos or the `public_repo`
         * scope for public repos. GitHub Apps must have the `repo` write permission to use this endpoint.
         */
        updateDefaultSetup: {
            (params?: RestEndpointMethodTypes["codeScanning"]["updateDefaultSetup"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["updateDefaultSetup"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Uploads SARIF data containing the results of a code scanning analysis to make the results available in a repository. You must use an access token with the `security_events` scope to use this endpoint for private repositories. You can also use tokens with the `public_repo` scope for public repositories only. GitHub Apps must have the `security_events` write permission to use this endpoint.
         *
         * There are two places where you can upload code scanning results.
         *  - If you upload to a pull request, for example `--ref refs/pull/42/merge` or `--ref refs/pull/42/head`, then the results appear as alerts in a pull request check. For more information, see "[Triaging code scanning alerts in pull requests](/code-security/secure-coding/triaging-code-scanning-alerts-in-pull-requests)."
         *  - If you upload to a branch, for example `--ref refs/heads/my-branch`, then the results appear in the **Security** tab for your repository. For more information, see "[Managing code scanning alerts for your repository](/code-security/secure-coding/managing-code-scanning-alerts-for-your-repository#viewing-the-alerts-for-a-repository)."
         *
         * You must compress the SARIF-formatted analysis data that you want to upload, using `gzip`, and then encode it as a Base64 format string. For example:
         *
         * ```
         * gzip -c analysis-data.sarif | base64 -w0
         * ```
         * <br>
         * SARIF upload supports a maximum number of entries per the following data objects, and an analysis will be rejected if any of these objects is above its maximum value. For some objects, there are additional values over which the entries will be ignored while keeping the most important entries whenever applicable.
         * To get the most out of your analysis when it includes data above the supported limits, try to optimize the analysis configuration. For example, for the CodeQL tool, identify and remove the most noisy queries.
         *
         *
         * | **SARIF data**                   | **Maximum values** | **Additional limits**                                                            |
         * |----------------------------------|:------------------:|----------------------------------------------------------------------------------|
         * | Runs per file                    |         20         |                                                                                  |
         * | Results per run                  |       25,000       | Only the top 5,000 results will be included, prioritized by severity.            |
         * | Rules per run                    |       25,000       |                                                                                  |
         * | Tool extensions per run          |        100         |                                                                                  |
         * | Thread Flow Locations per result |       10,000       | Only the top 1,000 Thread Flow Locations will be included, using prioritization. |
         * | Location per result	             |       1,000        | Only 100 locations will be included.                                             |
         * | Tags per rule	                   |         20         | Only 10 tags will be included.                                                   |
         *
         *
         * The `202 Accepted` response includes an `id` value.
         * You can use this ID to check the status of the upload by using it in the `/sarifs/{sarif_id}` endpoint.
         * For more information, see "[Get information about a SARIF upload](/rest/reference/code-scanning#get-information-about-a-sarif-upload)."
         */
        uploadSarif: {
            (params?: RestEndpointMethodTypes["codeScanning"]["uploadSarif"]["parameters"]): Promise<RestEndpointMethodTypes["codeScanning"]["uploadSarif"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    codesOfConduct: {
        getAllCodesOfConduct: {
            (params?: RestEndpointMethodTypes["codesOfConduct"]["getAllCodesOfConduct"]["parameters"]): Promise<RestEndpointMethodTypes["codesOfConduct"]["getAllCodesOfConduct"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        getConductCode: {
            (params?: RestEndpointMethodTypes["codesOfConduct"]["getConductCode"]["parameters"]): Promise<RestEndpointMethodTypes["codesOfConduct"]["getConductCode"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    codespaces: {
        /**
         * Adds a repository to the selected repositories for a user's codespace secret.
         * You must authenticate using an access token with the `codespace` or `codespace:secrets` scope to use this endpoint. User must have Codespaces access to use this endpoint.
         * GitHub Apps must have write access to the `codespaces_user_secrets` user permission and write access to the `codespaces_secrets` repository permission on the referenced repository to use this endpoint.
         */
        addRepositoryForSecretForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["addRepositoryForSecretForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["addRepositoryForSecretForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Adds a repository to an organization secret when the `visibility` for repository access is set to `selected`. The visibility is set when you [Create or update an organization secret](https://docs.github.com/rest/reference/codespaces#create-or-update-an-organization-secret). You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        addSelectedRepoToOrgSecret: {
            (params?: RestEndpointMethodTypes["codespaces"]["addSelectedRepoToOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["addSelectedRepoToOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the machine types a codespace can transition to use.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have read access to the `codespaces_metadata` repository permission to use this endpoint.
         */
        codespaceMachinesForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["codespaceMachinesForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["codespaceMachinesForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a new codespace, owned by the authenticated user.
         *
         * This endpoint requires either a `repository_id` OR a `pull_request` but not both.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces` repository permission to use this endpoint.
         */
        createForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["createForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["createForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates or updates an organization secret with an encrypted value. Encrypt your secret using
         * [LibSodium](https://libsodium.gitbook.io/doc/bindings_for_other_languages). You must authenticate using an access
         * token with the `admin:org` scope to use this endpoint.
         *
         * **Example encrypting a secret using Node.js**
         *
         * Encrypt your secret using the [libsodium-wrappers](https://www.npmjs.com/package/libsodium-wrappers) library.
         *
         * ```
         * const sodium = require('libsodium-wrappers')
         * const secret = 'plain-text-secret' // replace with the secret you want to encrypt
         * const key = 'base64-encoded-public-key' // replace with the Base64 encoded public key
         *
         * //Check if libsodium is ready and then proceed.
         * sodium.ready.then(() => {
         *   // Convert Secret & Base64 key to Uint8Array.
         *   let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
         *   let binsec = sodium.from_string(secret)
         *
         *   //Encrypt the secret using LibSodium
         *   let encBytes = sodium.crypto_box_seal(binsec, binkey)
         *
         *   // Convert encrypted Uint8Array to Base64
         *   let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
         *
         *   console.log(output)
         * });
         * ```
         *
         * **Example encrypting a secret using Python**
         *
         * Encrypt your secret using [pynacl](https://pynacl.readthedocs.io/en/latest/public/#nacl-public-sealedbox) with Python 3.
         *
         * ```
         * from base64 import b64encode
         * from nacl import encoding, public
         *
         * def encrypt(public_key: str, secret_value: str) -> str:
         *   """Encrypt a Unicode string using the public key."""
         *   public_key = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
         *   sealed_box = public.SealedBox(public_key)
         *   encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
         *   return b64encode(encrypted).decode("utf-8")
         * ```
         *
         * **Example encrypting a secret using C#**
         *
         * Encrypt your secret using the [Sodium.Core](https://www.nuget.org/packages/Sodium.Core/) package.
         *
         * ```
         * var secretValue = System.Text.Encoding.UTF8.GetBytes("mySecret");
         * var publicKey = Convert.FromBase64String("2Sg8iYjAxxmI2LvUXpJjkYrMxURPc8r+dB7TJyvvcCU=");
         *
         * var sealedPublicKeyBox = Sodium.SealedPublicKeyBox.Create(secretValue, publicKey);
         *
         * Console.WriteLine(Convert.ToBase64String(sealedPublicKeyBox));
         * ```
         *
         * **Example encrypting a secret using Ruby**
         *
         * Encrypt your secret using the [rbnacl](https://github.com/RubyCrypto/rbnacl) gem.
         *
         * ```ruby
         * require "rbnacl"
         * require "base64"
         *
         * key = Base64.decode64("+ZYvJDZMHUfBkJdyq5Zm9SKqeuBQ4sj+6sfjlH4CgG0=")
         * public_key = RbNaCl::PublicKey.new(key)
         *
         * box = RbNaCl::Boxes::Sealed.from_public_key(public_key)
         * encrypted_secret = box.encrypt("my_secret")
         *
         * # Print the base64 encoded secret
         * puts Base64.strict_encode64(encrypted_secret)
         * ```
         */
        createOrUpdateOrgSecret: {
            (params?: RestEndpointMethodTypes["codespaces"]["createOrUpdateOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["createOrUpdateOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates or updates a repository secret with an encrypted value. Encrypt your secret using
         * [LibSodium](https://libsodium.gitbook.io/doc/bindings_for_other_languages). You must authenticate using an access
         * token with the `repo` scope to use this endpoint. GitHub Apps must have write access to the `codespaces_secrets`
         * repository permission to use this endpoint.
         *
         * #### Example of encrypting a secret using Node.js
         *
         * Encrypt your secret using the [libsodium-wrappers](https://www.npmjs.com/package/libsodium-wrappers) library.
         *
         * ```
         * const sodium = require('libsodium-wrappers')
         * const secret = 'plain-text-secret' // replace with the secret you want to encrypt
         * const key = 'base64-encoded-public-key' // replace with the Base64 encoded public key
         *
         * //Check if libsodium is ready and then proceed.
         * sodium.ready.then(() => {
         *   // Convert Secret & Base64 key to Uint8Array.
         *   let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
         *   let binsec = sodium.from_string(secret)
         *
         *   //Encrypt the secret using LibSodium
         *   let encBytes = sodium.crypto_box_seal(binsec, binkey)
         *
         *   // Convert encrypted Uint8Array to Base64
         *   let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
         *
         *   console.log(output)
         * });
         * ```
         *
         * #### Example of encrypting a secret using Python
         *
         * Encrypt your secret using [pynacl](https://pynacl.readthedocs.io/en/latest/public/#nacl-public-sealedbox) with Python 3.
         *
         * ```
         * from base64 import b64encode
         * from nacl import encoding, public
         *
         * def encrypt(public_key: str, secret_value: str) -> str:
         *   """Encrypt a Unicode string using the public key."""
         *   public_key = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
         *   sealed_box = public.SealedBox(public_key)
         *   encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
         *   return b64encode(encrypted).decode("utf-8")
         * ```
         *
         * #### Example of encrypting a secret using C#
         *
         * Encrypt your secret using the [Sodium.Core](https://www.nuget.org/packages/Sodium.Core/) package.
         *
         * ```
         * var secretValue = System.Text.Encoding.UTF8.GetBytes("mySecret");
         * var publicKey = Convert.FromBase64String("2Sg8iYjAxxmI2LvUXpJjkYrMxURPc8r+dB7TJyvvcCU=");
         *
         * var sealedPublicKeyBox = Sodium.SealedPublicKeyBox.Create(secretValue, publicKey);
         *
         * Console.WriteLine(Convert.ToBase64String(sealedPublicKeyBox));
         * ```
         *
         * #### Example of encrypting a secret using Ruby
         *
         * Encrypt your secret using the [rbnacl](https://github.com/RubyCrypto/rbnacl) gem.
         *
         * ```ruby
         * require "rbnacl"
         * require "base64"
         *
         * key = Base64.decode64("+ZYvJDZMHUfBkJdyq5Zm9SKqeuBQ4sj+6sfjlH4CgG0=")
         * public_key = RbNaCl::PublicKey.new(key)
         *
         * box = RbNaCl::Boxes::Sealed.from_public_key(public_key)
         * encrypted_secret = box.encrypt("my_secret")
         *
         * # Print the base64 encoded secret
         * puts Base64.strict_encode64(encrypted_secret)
         * ```
         */
        createOrUpdateRepoSecret: {
            (params?: RestEndpointMethodTypes["codespaces"]["createOrUpdateRepoSecret"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["createOrUpdateRepoSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates or updates a secret for a user's codespace with an encrypted value. Encrypt your secret using
         * [LibSodium](https://libsodium.gitbook.io/doc/bindings_for_other_languages).
         *
         * You must authenticate using an access token with the `codespace` or `codespace:secrets` scope to use this endpoint. User must also have Codespaces access to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces_user_secrets` user permission and `codespaces_secrets` repository permission on all referenced repositories to use this endpoint.
         *
         * **Example encrypting a secret using Node.js**
         *
         * Encrypt your secret using the [libsodium-wrappers](https://www.npmjs.com/package/libsodium-wrappers) library.
         *
         * ```
         * const sodium = require('libsodium-wrappers')
         * const secret = 'plain-text-secret' // replace with the secret you want to encrypt
         * const key = 'base64-encoded-public-key' // replace with the Base64 encoded public key
         *
         * //Check if libsodium is ready and then proceed.
         * sodium.ready.then(() => {
         *   // Convert Secret & Base64 key to Uint8Array.
         *   let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
         *   let binsec = sodium.from_string(secret)
         *
         *   //Encrypt the secret using LibSodium
         *   let encBytes = sodium.crypto_box_seal(binsec, binkey)
         *
         *   // Convert encrypted Uint8Array to Base64
         *   let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
         *
         *   console.log(output)
         * });
         * ```
         *
         * **Example encrypting a secret using Python**
         *
         * Encrypt your secret using [pynacl](https://pynacl.readthedocs.io/en/latest/public/#nacl-public-sealedbox) with Python 3.
         *
         * ```
         * from base64 import b64encode
         * from nacl import encoding, public
         *
         * def encrypt(public_key: str, secret_value: str) -> str:
         *   """Encrypt a Unicode string using the public key."""
         *   public_key = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
         *   sealed_box = public.SealedBox(public_key)
         *   encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
         *   return b64encode(encrypted).decode("utf-8")
         * ```
         *
         * **Example encrypting a secret using C#**
         *
         * Encrypt your secret using the [Sodium.Core](https://www.nuget.org/packages/Sodium.Core/) package.
         *
         * ```
         * var secretValue = System.Text.Encoding.UTF8.GetBytes("mySecret");
         * var publicKey = Convert.FromBase64String("2Sg8iYjAxxmI2LvUXpJjkYrMxURPc8r+dB7TJyvvcCU=");
         *
         * var sealedPublicKeyBox = Sodium.SealedPublicKeyBox.Create(secretValue, publicKey);
         *
         * Console.WriteLine(Convert.ToBase64String(sealedPublicKeyBox));
         * ```
         *
         * **Example encrypting a secret using Ruby**
         *
         * Encrypt your secret using the [rbnacl](https://github.com/RubyCrypto/rbnacl) gem.
         *
         * ```ruby
         * require "rbnacl"
         * require "base64"
         *
         * key = Base64.decode64("+ZYvJDZMHUfBkJdyq5Zm9SKqeuBQ4sj+6sfjlH4CgG0=")
         * public_key = RbNaCl::PublicKey.new(key)
         *
         * box = RbNaCl::Boxes::Sealed.from_public_key(public_key)
         * encrypted_secret = box.encrypt("my_secret")
         *
         * # Print the base64 encoded secret
         * puts Base64.strict_encode64(encrypted_secret)
         * ```
         */
        createOrUpdateSecretForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["createOrUpdateSecretForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["createOrUpdateSecretForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a codespace owned by the authenticated user for the specified pull request.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces` repository permission to use this endpoint.
         */
        createWithPrForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["createWithPrForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["createWithPrForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a codespace owned by the authenticated user in the specified repository.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces` repository permission to use this endpoint.
         */
        createWithRepoForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["createWithRepoForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["createWithRepoForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Codespaces for the specified users will no longer be billed to the organization.
         * To use this endpoint, the billing settings for the organization must be set to `selected_members`. For information on how to change this setting please see [these docs].(https://docs.github.com/rest/codespaces/organizations#manage-access-control-for-organization-codespaces) You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        deleteCodespacesBillingUsers: {
            (params?: RestEndpointMethodTypes["codespaces"]["deleteCodespacesBillingUsers"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["deleteCodespacesBillingUsers"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a user's codespace.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces` repository permission to use this endpoint.
         */
        deleteForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["deleteForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["deleteForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a user's codespace.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        deleteFromOrganization: {
            (params?: RestEndpointMethodTypes["codespaces"]["deleteFromOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["deleteFromOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes an organization secret using the secret name. You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        deleteOrgSecret: {
            (params?: RestEndpointMethodTypes["codespaces"]["deleteOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["deleteOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a secret in a repository using the secret name. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have write access to the `codespaces_secrets` repository permission to use this endpoint.
         */
        deleteRepoSecret: {
            (params?: RestEndpointMethodTypes["codespaces"]["deleteRepoSecret"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["deleteRepoSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a secret from a user's codespaces using the secret name. Deleting the secret will remove access from all codespaces that were allowed to access the secret.
         *
         * You must authenticate using an access token with the `codespace` or `codespace:secrets` scope to use this endpoint. User must have Codespaces access to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces_user_secrets` user permission to use this endpoint.
         */
        deleteSecretForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["deleteSecretForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["deleteSecretForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Triggers an export of the specified codespace and returns a URL and ID where the status of the export can be monitored.
         *
         * If changes cannot be pushed to the codespace's repository, they will be pushed to a new or previously-existing fork instead.
         *
         * You must authenticate using a personal access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces_lifecycle_admin` repository permission to use this endpoint.
         */
        exportForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["exportForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["exportForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the codespaces that a member of an organization has for repositories in that organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        getCodespacesForUserInOrg: {
            (params?: RestEndpointMethodTypes["codespaces"]["getCodespacesForUserInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["getCodespacesForUserInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets information about an export of a codespace.
         *
         * You must authenticate using a personal access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have read access to the `codespaces_lifecycle_admin` repository permission to use this endpoint.
         */
        getExportDetailsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["getExportDetailsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["getExportDetailsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets information about a user's codespace.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have read access to the `codespaces` repository permission to use this endpoint.
         */
        getForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["getForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["getForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a public key for an organization, which is required in order to encrypt secrets. You need to encrypt the value of a secret before you can create or update secrets. You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        getOrgPublicKey: {
            (params?: RestEndpointMethodTypes["codespaces"]["getOrgPublicKey"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["getOrgPublicKey"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets an organization secret without revealing its encrypted value.
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        getOrgSecret: {
            (params?: RestEndpointMethodTypes["codespaces"]["getOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["getOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets your public key, which you need to encrypt secrets. You need to encrypt a secret before you can create or update secrets.
         *
         * You must authenticate using an access token with the `codespace` or `codespace:secrets` scope to use this endpoint. User must have Codespaces access to use this endpoint.
         *
         * GitHub Apps must have read access to the `codespaces_user_secrets` user permission to use this endpoint.
         */
        getPublicKeyForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["getPublicKeyForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["getPublicKeyForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets your public key, which you need to encrypt secrets. You need to encrypt a secret before you can create or update secrets. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have write access to the `codespaces_secrets` repository permission to use this endpoint.
         */
        getRepoPublicKey: {
            (params?: RestEndpointMethodTypes["codespaces"]["getRepoPublicKey"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["getRepoPublicKey"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a single repository secret without revealing its encrypted value. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have write access to the `codespaces_secrets` repository permission to use this endpoint.
         */
        getRepoSecret: {
            (params?: RestEndpointMethodTypes["codespaces"]["getRepoSecret"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["getRepoSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a secret available to a user's codespaces without revealing its encrypted value.
         *
         * You must authenticate using an access token with the `codespace` or `codespace:secrets` scope to use this endpoint. User must have Codespaces access to use this endpoint.
         *
         * GitHub Apps must have read access to the `codespaces_user_secrets` user permission to use this endpoint.
         */
        getSecretForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["getSecretForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["getSecretForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the devcontainer.json files associated with a specified repository and the authenticated user. These files
         * specify launchpoint configurations for codespaces created within the repository.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have read access to the `codespaces_metadata` repository permission to use this endpoint.
         */
        listDevcontainersInRepositoryForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["listDevcontainersInRepositoryForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["listDevcontainersInRepositoryForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the authenticated user's codespaces.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have read access to the `codespaces` repository permission to use this endpoint.
         */
        listForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["listForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["listForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the codespaces associated to a specified organization.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        listInOrganization: {
            (params?: RestEndpointMethodTypes["codespaces"]["listInOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["listInOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the codespaces associated to a specified repository and the authenticated user.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have read access to the `codespaces` repository permission to use this endpoint.
         */
        listInRepositoryForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["listInRepositoryForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["listInRepositoryForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all Codespaces secrets available at the organization-level without revealing their encrypted values.
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        listOrgSecrets: {
            (params?: RestEndpointMethodTypes["codespaces"]["listOrgSecrets"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["listOrgSecrets"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all secrets available in a repository without revealing their encrypted values. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have write access to the `codespaces_secrets` repository permission to use this endpoint.
         */
        listRepoSecrets: {
            (params?: RestEndpointMethodTypes["codespaces"]["listRepoSecrets"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["listRepoSecrets"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the repositories that have been granted the ability to use a user's codespace secret.
         *
         * You must authenticate using an access token with the `codespace` or `codespace:secrets` scope to use this endpoint. User must have Codespaces access to use this endpoint.
         *
         * GitHub Apps must have read access to the `codespaces_user_secrets` user permission and write access to the `codespaces_secrets` repository permission on all referenced repositories to use this endpoint.
         */
        listRepositoriesForSecretForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["listRepositoriesForSecretForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["listRepositoriesForSecretForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all secrets available for a user's Codespaces without revealing their
         * encrypted values.
         *
         * You must authenticate using an access token with the `codespace` or `codespace:secrets` scope to use this endpoint. User must have Codespaces access to use this endpoint.
         *
         * GitHub Apps must have read access to the `codespaces_user_secrets` user permission to use this endpoint.
         */
        listSecretsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["listSecretsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["listSecretsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all repositories that have been selected when the `visibility` for repository access to a secret is set to `selected`. You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        listSelectedReposForOrgSecret: {
            (params?: RestEndpointMethodTypes["codespaces"]["listSelectedReposForOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["listSelectedReposForOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the default attributes for codespaces created by the user with the repository.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces` repository permission to use this endpoint.
         */
        preFlightWithRepoForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["preFlightWithRepoForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["preFlightWithRepoForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Publishes an unpublished codespace, creating a new repository and assigning it to the codespace.
         *
         * The codespace's token is granted write permissions to the repository, allowing the user to push their changes.
         *
         * This will fail for a codespace that is already published, meaning it has an associated repository.
         *
         * You must authenticate using a personal access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces` repository permission to use this endpoint.
         */
        publishForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["publishForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["publishForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a repository from the selected repositories for a user's codespace secret.
         * You must authenticate using an access token with the `codespace` or `codespace:secrets` scope to use this endpoint. User must have Codespaces access to use this endpoint.
         * GitHub Apps must have write access to the `codespaces_user_secrets` user permission to use this endpoint.
         */
        removeRepositoryForSecretForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["removeRepositoryForSecretForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["removeRepositoryForSecretForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a repository from an organization secret when the `visibility` for repository access is set to `selected`. The visibility is set when you [Create or update an organization secret](https://docs.github.com/rest/reference/codespaces#create-or-update-an-organization-secret). You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        removeSelectedRepoFromOrgSecret: {
            (params?: RestEndpointMethodTypes["codespaces"]["removeSelectedRepoFromOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["removeSelectedRepoFromOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the machine types available for a given repository based on its configuration.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces_metadata` repository permission to use this endpoint.
         */
        repoMachinesForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["repoMachinesForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["repoMachinesForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sets which users can access codespaces in an organization. This is synonymous with granting or revoking codespaces billing permissions for users according to the visibility.
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        setCodespacesBilling: {
            (params?: RestEndpointMethodTypes["codespaces"]["setCodespacesBilling"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["setCodespacesBilling"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Codespaces for the specified users will be billed to the organization.
         * To use this endpoint, the billing settings for the organization must be set to `selected_members`. For information on how to change this setting please see [these docs].(https://docs.github.com/rest/codespaces/organizations#manage-access-control-for-organization-codespaces) You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        setCodespacesBillingUsers: {
            (params?: RestEndpointMethodTypes["codespaces"]["setCodespacesBillingUsers"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["setCodespacesBillingUsers"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Select the repositories that will use a user's codespace secret.
         *
         * You must authenticate using an access token with the `codespace` or `codespace:secrets` scope to use this endpoint. User must have Codespaces access to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces_user_secrets` user permission and write access to the `codespaces_secrets` repository permission on all referenced repositories to use this endpoint.
         */
        setRepositoriesForSecretForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["setRepositoriesForSecretForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["setRepositoriesForSecretForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Replaces all repositories for an organization secret when the `visibility` for repository access is set to `selected`. The visibility is set when you [Create or update an organization secret](https://docs.github.com/rest/reference/codespaces#create-or-update-an-organization-secret). You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        setSelectedReposForOrgSecret: {
            (params?: RestEndpointMethodTypes["codespaces"]["setSelectedReposForOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["setSelectedReposForOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Starts a user's codespace.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces_lifecycle_admin` repository permission to use this endpoint.
         */
        startForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["startForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["startForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Stops a user's codespace.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces_lifecycle_admin` repository permission to use this endpoint.
         */
        stopForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["stopForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["stopForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Stops a user's codespace.
         *
         * You must authenticate using an access token with the `admin:org` scope to use this endpoint.
         */
        stopInOrganization: {
            (params?: RestEndpointMethodTypes["codespaces"]["stopInOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["stopInOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates a codespace owned by the authenticated user. Currently only the codespace's machine type and recent folders can be modified using this endpoint.
         *
         * If you specify a new machine type it will be applied the next time your codespace is started.
         *
         * You must authenticate using an access token with the `codespace` scope to use this endpoint.
         *
         * GitHub Apps must have write access to the `codespaces` repository permission to use this endpoint.
         */
        updateForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["codespaces"]["updateForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["codespaces"]["updateForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    dependabot: {
        /**
         * Adds a repository to an organization secret when the `visibility` for repository access is set to `selected`. The visibility is set when you [Create or update an organization secret](https://docs.github.com/rest/reference/dependabot#create-or-update-an-organization-secret). You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` organization permission to use this endpoint.
         */
        addSelectedRepoToOrgSecret: {
            (params?: RestEndpointMethodTypes["dependabot"]["addSelectedRepoToOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["addSelectedRepoToOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates or updates an organization secret with an encrypted value. Encrypt your secret using
         * [LibSodium](https://libsodium.gitbook.io/doc/bindings_for_other_languages). You must authenticate using an access
         * token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` organization
         * permission to use this endpoint.
         *
         * #### Example encrypting a secret using Node.js
         *
         * Encrypt your secret using the [tweetsodium](https://github.com/github/tweetsodium) library.
         *
         * ```
         * const sodium = require('tweetsodium');
         *
         * const key = "base64-encoded-public-key";
         * const value = "plain-text-secret";
         *
         * // Convert the message and key to Uint8Array's (Buffer implements that interface)
         * const messageBytes = Buffer.from(value);
         * const keyBytes = Buffer.from(key, 'base64');
         *
         * // Encrypt using LibSodium.
         * const encryptedBytes = sodium.seal(messageBytes, keyBytes);
         *
         * // Base64 the encrypted secret
         * const encrypted = Buffer.from(encryptedBytes).toString('base64');
         *
         * console.log(encrypted);
         * ```
         *
         *
         * #### Example encrypting a secret using Python
         *
         * Encrypt your secret using [pynacl](https://pynacl.readthedocs.io/en/latest/public/#nacl-public-sealedbox) with Python 3.
         *
         * ```
         * from base64 import b64encode
         * from nacl import encoding, public
         *
         * def encrypt(public_key: str, secret_value: str) -> str:
         *   """Encrypt a Unicode string using the public key."""
         *   public_key = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
         *   sealed_box = public.SealedBox(public_key)
         *   encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
         *   return b64encode(encrypted).decode("utf-8")
         * ```
         *
         * #### Example encrypting a secret using C#
         *
         * Encrypt your secret using the [Sodium.Core](https://www.nuget.org/packages/Sodium.Core/) package.
         *
         * ```
         * var secretValue = System.Text.Encoding.UTF8.GetBytes("mySecret");
         * var publicKey = Convert.FromBase64String("2Sg8iYjAxxmI2LvUXpJjkYrMxURPc8r+dB7TJyvvcCU=");
         *
         * var sealedPublicKeyBox = Sodium.SealedPublicKeyBox.Create(secretValue, publicKey);
         *
         * Console.WriteLine(Convert.ToBase64String(sealedPublicKeyBox));
         * ```
         *
         * #### Example encrypting a secret using Ruby
         *
         * Encrypt your secret using the [rbnacl](https://github.com/RubyCrypto/rbnacl) gem.
         *
         * ```ruby
         * require "rbnacl"
         * require "base64"
         *
         * key = Base64.decode64("+ZYvJDZMHUfBkJdyq5Zm9SKqeuBQ4sj+6sfjlH4CgG0=")
         * public_key = RbNaCl::PublicKey.new(key)
         *
         * box = RbNaCl::Boxes::Sealed.from_public_key(public_key)
         * encrypted_secret = box.encrypt("my_secret")
         *
         * # Print the base64 encoded secret
         * puts Base64.strict_encode64(encrypted_secret)
         * ```
         */
        createOrUpdateOrgSecret: {
            (params?: RestEndpointMethodTypes["dependabot"]["createOrUpdateOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["createOrUpdateOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates or updates a repository secret with an encrypted value. Encrypt your secret using
         * [LibSodium](https://libsodium.gitbook.io/doc/bindings_for_other_languages). You must authenticate using an access
         * token with the `repo` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` repository
         * permission to use this endpoint.
         *
         * **Example encrypting a secret using Node.js**
         *
         * Encrypt your secret using the [libsodium-wrappers](https://www.npmjs.com/package/libsodium-wrappers) library.
         *
         * ```
         * const sodium = require('libsodium-wrappers')
         * const secret = 'plain-text-secret' // replace with the secret you want to encrypt
         * const key = 'base64-encoded-public-key' // replace with the Base64 encoded public key
         *
         * //Check if libsodium is ready and then proceed.
         * sodium.ready.then(() => {
         *   // Convert Secret & Base64 key to Uint8Array.
         *   let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL)
         *   let binsec = sodium.from_string(secret)
         *
         *   //Encrypt the secret using LibSodium
         *   let encBytes = sodium.crypto_box_seal(binsec, binkey)
         *
         *   // Convert encrypted Uint8Array to Base64
         *   let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL)
         *
         *   console.log(output)
         * });
         * ```
         *
         * **Example encrypting a secret using Python**
         *
         * Encrypt your secret using [pynacl](https://pynacl.readthedocs.io/en/latest/public/#nacl-public-sealedbox) with Python 3.
         *
         * ```
         * from base64 import b64encode
         * from nacl import encoding, public
         *
         * def encrypt(public_key: str, secret_value: str) -> str:
         *   """Encrypt a Unicode string using the public key."""
         *   public_key = public.PublicKey(public_key.encode("utf-8"), encoding.Base64Encoder())
         *   sealed_box = public.SealedBox(public_key)
         *   encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
         *   return b64encode(encrypted).decode("utf-8")
         * ```
         *
         * **Example encrypting a secret using C#**
         *
         * Encrypt your secret using the [Sodium.Core](https://www.nuget.org/packages/Sodium.Core/) package.
         *
         * ```
         * var secretValue = System.Text.Encoding.UTF8.GetBytes("mySecret");
         * var publicKey = Convert.FromBase64String("2Sg8iYjAxxmI2LvUXpJjkYrMxURPc8r+dB7TJyvvcCU=");
         *
         * var sealedPublicKeyBox = Sodium.SealedPublicKeyBox.Create(secretValue, publicKey);
         *
         * Console.WriteLine(Convert.ToBase64String(sealedPublicKeyBox));
         * ```
         *
         * **Example encrypting a secret using Ruby**
         *
         * Encrypt your secret using the [rbnacl](https://github.com/RubyCrypto/rbnacl) gem.
         *
         * ```ruby
         * require "rbnacl"
         * require "base64"
         *
         * key = Base64.decode64("+ZYvJDZMHUfBkJdyq5Zm9SKqeuBQ4sj+6sfjlH4CgG0=")
         * public_key = RbNaCl::PublicKey.new(key)
         *
         * box = RbNaCl::Boxes::Sealed.from_public_key(public_key)
         * encrypted_secret = box.encrypt("my_secret")
         *
         * # Print the base64 encoded secret
         * puts Base64.strict_encode64(encrypted_secret)
         * ```
         */
        createOrUpdateRepoSecret: {
            (params?: RestEndpointMethodTypes["dependabot"]["createOrUpdateRepoSecret"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["createOrUpdateRepoSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a secret in an organization using the secret name. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` organization permission to use this endpoint.
         */
        deleteOrgSecret: {
            (params?: RestEndpointMethodTypes["dependabot"]["deleteOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["deleteOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a secret in a repository using the secret name. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` repository permission to use this endpoint.
         */
        deleteRepoSecret: {
            (params?: RestEndpointMethodTypes["dependabot"]["deleteRepoSecret"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["deleteRepoSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You must use an access token with the `security_events` scope to use this endpoint with private repositories.
         * You can also use tokens with the `public_repo` scope for public repositories only.
         * GitHub Apps must have **Dependabot alerts** read permission to use this endpoint.
         */
        getAlert: {
            (params?: RestEndpointMethodTypes["dependabot"]["getAlert"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["getAlert"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets your public key, which you need to encrypt secrets. You need to encrypt a secret before you can create or update secrets. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` organization permission to use this endpoint.
         */
        getOrgPublicKey: {
            (params?: RestEndpointMethodTypes["dependabot"]["getOrgPublicKey"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["getOrgPublicKey"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a single organization secret without revealing its encrypted value. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` organization permission to use this endpoint.
         */
        getOrgSecret: {
            (params?: RestEndpointMethodTypes["dependabot"]["getOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["getOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets your public key, which you need to encrypt secrets. You need to encrypt a secret before you can create or update secrets. Anyone with read access to the repository can use this endpoint. If the repository is private you must use an access token with the `repo` scope. GitHub Apps must have the `dependabot_secrets` repository permission to use this endpoint.
         */
        getRepoPublicKey: {
            (params?: RestEndpointMethodTypes["dependabot"]["getRepoPublicKey"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["getRepoPublicKey"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a single repository secret without revealing its encrypted value. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` repository permission to use this endpoint.
         */
        getRepoSecret: {
            (params?: RestEndpointMethodTypes["dependabot"]["getRepoSecret"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["getRepoSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists Dependabot alerts for repositories that are owned by the specified enterprise.
         * To use this endpoint, you must be a member of the enterprise, and you must use an
         * access token with the `repo` scope or `security_events` scope.
         * Alerts are only returned for organizations in the enterprise for which you are an organization owner or a security manager. For more information about security managers, see "[Managing security managers in your organization](https://docs.github.com/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization)."
         */
        listAlertsForEnterprise: {
            (params?: RestEndpointMethodTypes["dependabot"]["listAlertsForEnterprise"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["listAlertsForEnterprise"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists Dependabot alerts for an organization.
         *
         * To use this endpoint, you must be an owner or security manager for the organization, and you must use an access token with the `repo` scope or `security_events` scope.
         *
         * For public repositories, you may instead use the `public_repo` scope.
         *
         * GitHub Apps must have **Dependabot alerts** read permission to use this endpoint.
         */
        listAlertsForOrg: {
            (params?: RestEndpointMethodTypes["dependabot"]["listAlertsForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["listAlertsForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You must use an access token with the `security_events` scope to use this endpoint with private repositories.
         * You can also use tokens with the `public_repo` scope for public repositories only.
         * GitHub Apps must have **Dependabot alerts** read permission to use this endpoint.
         */
        listAlertsForRepo: {
            (params?: RestEndpointMethodTypes["dependabot"]["listAlertsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["listAlertsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all secrets available in an organization without revealing their encrypted values. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` organization permission to use this endpoint.
         */
        listOrgSecrets: {
            (params?: RestEndpointMethodTypes["dependabot"]["listOrgSecrets"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["listOrgSecrets"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all secrets available in a repository without revealing their encrypted values. You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` repository permission to use this endpoint.
         */
        listRepoSecrets: {
            (params?: RestEndpointMethodTypes["dependabot"]["listRepoSecrets"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["listRepoSecrets"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all repositories that have been selected when the `visibility` for repository access to a secret is set to `selected`. You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` organization permission to use this endpoint.
         */
        listSelectedReposForOrgSecret: {
            (params?: RestEndpointMethodTypes["dependabot"]["listSelectedReposForOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["listSelectedReposForOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a repository from an organization secret when the `visibility` for repository access is set to `selected`. The visibility is set when you [Create or update an organization secret](https://docs.github.com/rest/reference/dependabot#create-or-update-an-organization-secret). You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` organization permission to use this endpoint.
         */
        removeSelectedRepoFromOrgSecret: {
            (params?: RestEndpointMethodTypes["dependabot"]["removeSelectedRepoFromOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["removeSelectedRepoFromOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Replaces all repositories for an organization secret when the `visibility` for repository access is set to `selected`. The visibility is set when you [Create or update an organization secret](https://docs.github.com/rest/reference/dependabot#create-or-update-an-organization-secret). You must authenticate using an access token with the `admin:org` scope to use this endpoint. GitHub Apps must have the `dependabot_secrets` organization permission to use this endpoint.
         */
        setSelectedReposForOrgSecret: {
            (params?: RestEndpointMethodTypes["dependabot"]["setSelectedReposForOrgSecret"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["setSelectedReposForOrgSecret"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You must use an access token with the `security_events` scope to use this endpoint with private repositories.
         * You can also use tokens with the `public_repo` scope for public repositories only.
         * GitHub Apps must have **Dependabot alerts** write permission to use this endpoint.
         *
         * To use this endpoint, you must have access to security alerts for the repository. For more information, see "[Granting access to security alerts](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-security-and-analysis-settings-for-your-repository#granting-access-to-security-alerts)."
         */
        updateAlert: {
            (params?: RestEndpointMethodTypes["dependabot"]["updateAlert"]["parameters"]): Promise<RestEndpointMethodTypes["dependabot"]["updateAlert"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    dependencyGraph: {
        /**
         * Create a new snapshot of a repository's dependencies. You must authenticate using an access token with the `repo` scope to use this endpoint for a repository that the requesting user has access to.
         */
        createRepositorySnapshot: {
            (params?: RestEndpointMethodTypes["dependencyGraph"]["createRepositorySnapshot"]["parameters"]): Promise<RestEndpointMethodTypes["dependencyGraph"]["createRepositorySnapshot"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the diff of the dependency changes between two commits of a repository, based on the changes to the dependency manifests made in those commits.
         */
        diffRange: {
            (params?: RestEndpointMethodTypes["dependencyGraph"]["diffRange"]["parameters"]): Promise<RestEndpointMethodTypes["dependencyGraph"]["diffRange"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Exports the software bill of materials (SBOM) for a repository in SPDX JSON format.
         */
        exportSbom: {
            (params?: RestEndpointMethodTypes["dependencyGraph"]["exportSbom"]["parameters"]): Promise<RestEndpointMethodTypes["dependencyGraph"]["exportSbom"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    emojis: {
        /**
         * Lists all the emojis available to use on GitHub.
         */
        get: {
            (params?: RestEndpointMethodTypes["emojis"]["get"]["parameters"]): Promise<RestEndpointMethodTypes["emojis"]["get"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    gists: {
        checkIsStarred: {
            (params?: RestEndpointMethodTypes["gists"]["checkIsStarred"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["checkIsStarred"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Allows you to add a new gist with one or more files.
         *
         * **Note:** Don't name your files "gistfile" with a numerical suffix. This is the format of the automatic naming scheme that Gist uses internally.
         */
        create: {
            (params?: RestEndpointMethodTypes["gists"]["create"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["create"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        createComment: {
            (params?: RestEndpointMethodTypes["gists"]["createComment"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["createComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        delete: {
            (params?: RestEndpointMethodTypes["gists"]["delete"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["delete"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        deleteComment: {
            (params?: RestEndpointMethodTypes["gists"]["deleteComment"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["deleteComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        fork: {
            (params?: RestEndpointMethodTypes["gists"]["fork"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["fork"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        get: {
            (params?: RestEndpointMethodTypes["gists"]["get"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["get"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        getComment: {
            (params?: RestEndpointMethodTypes["gists"]["getComment"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["getComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        getRevision: {
            (params?: RestEndpointMethodTypes["gists"]["getRevision"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["getRevision"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the authenticated user's gists or if called anonymously, this endpoint returns all public gists:
         */
        list: {
            (params?: RestEndpointMethodTypes["gists"]["list"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["list"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listComments: {
            (params?: RestEndpointMethodTypes["gists"]["listComments"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["listComments"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listCommits: {
            (params?: RestEndpointMethodTypes["gists"]["listCommits"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["listCommits"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists public gists for the specified user:
         */
        listForUser: {
            (params?: RestEndpointMethodTypes["gists"]["listForUser"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["listForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listForks: {
            (params?: RestEndpointMethodTypes["gists"]["listForks"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["listForks"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List public gists sorted by most recently updated to least recently updated.
         *
         * Note: With [pagination](https://docs.github.com/rest/overview/resources-in-the-rest-api#pagination), you can fetch up to 3000 gists. For example, you can fetch 100 pages with 30 gists per page or 30 pages with 100 gists per page.
         */
        listPublic: {
            (params?: RestEndpointMethodTypes["gists"]["listPublic"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["listPublic"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the authenticated user's starred gists:
         */
        listStarred: {
            (params?: RestEndpointMethodTypes["gists"]["listStarred"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["listStarred"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Note that you'll need to set `Content-Length` to zero when calling out to this endpoint. For more information, see "[HTTP verbs](https://docs.github.com/rest/overview/resources-in-the-rest-api#http-verbs)."
         */
        star: {
            (params?: RestEndpointMethodTypes["gists"]["star"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["star"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        unstar: {
            (params?: RestEndpointMethodTypes["gists"]["unstar"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["unstar"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Allows you to update a gist's description and to update, delete, or rename gist files. Files from the previous version of the gist that aren't explicitly changed during an edit are unchanged.
         */
        update: {
            (params?: RestEndpointMethodTypes["gists"]["update"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["update"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        updateComment: {
            (params?: RestEndpointMethodTypes["gists"]["updateComment"]["parameters"]): Promise<RestEndpointMethodTypes["gists"]["updateComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    git: {
        createBlob: {
            (params?: RestEndpointMethodTypes["git"]["createBlob"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["createBlob"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a new Git [commit object](https://git-scm.com/book/en/v1/Git-Internals-Git-Objects#Commit-Objects).
         *
         * **Signature verification object**
         *
         * The response will include a `verification` object that describes the result of verifying the commit's signature. The following fields are included in the `verification` object:
         *
         * | Name | Type | Description |
         * | ---- | ---- | ----------- |
         * | `verified` | `boolean` | Indicates whether GitHub considers the signature in this commit to be verified. |
         * | `reason` | `string` | The reason for verified value. Possible values and their meanings are enumerated in the table below. |
         * | `signature` | `string` | The signature that was extracted from the commit. |
         * | `payload` | `string` | The value that was signed. |
         *
         * These are the possible values for `reason` in the `verification` object:
         *
         * | Value | Description |
         * | ----- | ----------- |
         * | `expired_key` | The key that made the signature is expired. |
         * | `not_signing_key` | The "signing" flag is not among the usage flags in the GPG key that made the signature. |
         * | `gpgverify_error` | There was an error communicating with the signature verification service. |
         * | `gpgverify_unavailable` | The signature verification service is currently unavailable. |
         * | `unsigned` | The object does not include a signature. |
         * | `unknown_signature_type` | A non-PGP signature was found in the commit. |
         * | `no_user` | No user was associated with the `committer` email address in the commit. |
         * | `unverified_email` | The `committer` email address in the commit was associated with a user, but the email address is not verified on their account. |
         * | `bad_email` | The `committer` email address in the commit is not included in the identities of the PGP key that made the signature. |
         * | `unknown_key` | The key that made the signature has not been registered with any user's account. |
         * | `malformed_signature` | There was an error parsing the signature. |
         * | `invalid` | The signature could not be cryptographically verified using the key whose key-id was found in the signature. |
         * | `valid` | None of the above errors applied, so the signature is considered to be verified. |
         */
        createCommit: {
            (params?: RestEndpointMethodTypes["git"]["createCommit"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["createCommit"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a reference for your repository. You are unable to create new references for empty repositories, even if the commit SHA-1 hash used exists. Empty repositories are repositories without branches.
         */
        createRef: {
            (params?: RestEndpointMethodTypes["git"]["createRef"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["createRef"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Note that creating a tag object does not create the reference that makes a tag in Git. If you want to create an annotated tag in Git, you have to do this call to create the tag object, and then [create](https://docs.github.com/rest/reference/git#create-a-reference) the `refs/tags/[tag]` reference. If you want to create a lightweight tag, you only have to [create](https://docs.github.com/rest/reference/git#create-a-reference) the tag reference - this call would be unnecessary.
         *
         * **Signature verification object**
         *
         * The response will include a `verification` object that describes the result of verifying the commit's signature. The following fields are included in the `verification` object:
         *
         * | Name | Type | Description |
         * | ---- | ---- | ----------- |
         * | `verified` | `boolean` | Indicates whether GitHub considers the signature in this commit to be verified. |
         * | `reason` | `string` | The reason for verified value. Possible values and their meanings are enumerated in table below. |
         * | `signature` | `string` | The signature that was extracted from the commit. |
         * | `payload` | `string` | The value that was signed. |
         *
         * These are the possible values for `reason` in the `verification` object:
         *
         * | Value | Description |
         * | ----- | ----------- |
         * | `expired_key` | The key that made the signature is expired. |
         * | `not_signing_key` | The "signing" flag is not among the usage flags in the GPG key that made the signature. |
         * | `gpgverify_error` | There was an error communicating with the signature verification service. |
         * | `gpgverify_unavailable` | The signature verification service is currently unavailable. |
         * | `unsigned` | The object does not include a signature. |
         * | `unknown_signature_type` | A non-PGP signature was found in the commit. |
         * | `no_user` | No user was associated with the `committer` email address in the commit. |
         * | `unverified_email` | The `committer` email address in the commit was associated with a user, but the email address is not verified on their account. |
         * | `bad_email` | The `committer` email address in the commit is not included in the identities of the PGP key that made the signature. |
         * | `unknown_key` | The key that made the signature has not been registered with any user's account. |
         * | `malformed_signature` | There was an error parsing the signature. |
         * | `invalid` | The signature could not be cryptographically verified using the key whose key-id was found in the signature. |
         * | `valid` | None of the above errors applied, so the signature is considered to be verified. |
         */
        createTag: {
            (params?: RestEndpointMethodTypes["git"]["createTag"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["createTag"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * The tree creation API accepts nested entries. If you specify both a tree and a nested path modifying that tree, this endpoint will overwrite the contents of the tree with the new path contents, and create a new tree structure.
         *
         * If you use this endpoint to add, delete, or modify the file contents in a tree, you will need to commit the tree and then update a branch to point to the commit. For more information see "[Create a commit](https://docs.github.com/rest/reference/git#create-a-commit)" and "[Update a reference](https://docs.github.com/rest/reference/git#update-a-reference)."
         *
         * Returns an error if you try to delete a file that does not exist.
         */
        createTree: {
            (params?: RestEndpointMethodTypes["git"]["createTree"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["createTree"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        deleteRef: {
            (params?: RestEndpointMethodTypes["git"]["deleteRef"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["deleteRef"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * The `content` in the response will always be Base64 encoded.
         *
         * _Note_: This API supports blobs up to 100 megabytes in size.
         */
        getBlob: {
            (params?: RestEndpointMethodTypes["git"]["getBlob"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["getBlob"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a Git [commit object](https://git-scm.com/book/en/v1/Git-Internals-Git-Objects#Commit-Objects).
         *
         * **Signature verification object**
         *
         * The response will include a `verification` object that describes the result of verifying the commit's signature. The following fields are included in the `verification` object:
         *
         * | Name | Type | Description |
         * | ---- | ---- | ----------- |
         * | `verified` | `boolean` | Indicates whether GitHub considers the signature in this commit to be verified. |
         * | `reason` | `string` | The reason for verified value. Possible values and their meanings are enumerated in the table below. |
         * | `signature` | `string` | The signature that was extracted from the commit. |
         * | `payload` | `string` | The value that was signed. |
         *
         * These are the possible values for `reason` in the `verification` object:
         *
         * | Value | Description |
         * | ----- | ----------- |
         * | `expired_key` | The key that made the signature is expired. |
         * | `not_signing_key` | The "signing" flag is not among the usage flags in the GPG key that made the signature. |
         * | `gpgverify_error` | There was an error communicating with the signature verification service. |
         * | `gpgverify_unavailable` | The signature verification service is currently unavailable. |
         * | `unsigned` | The object does not include a signature. |
         * | `unknown_signature_type` | A non-PGP signature was found in the commit. |
         * | `no_user` | No user was associated with the `committer` email address in the commit. |
         * | `unverified_email` | The `committer` email address in the commit was associated with a user, but the email address is not verified on their account. |
         * | `bad_email` | The `committer` email address in the commit is not included in the identities of the PGP key that made the signature. |
         * | `unknown_key` | The key that made the signature has not been registered with any user's account. |
         * | `malformed_signature` | There was an error parsing the signature. |
         * | `invalid` | The signature could not be cryptographically verified using the key whose key-id was found in the signature. |
         * | `valid` | None of the above errors applied, so the signature is considered to be verified. |
         */
        getCommit: {
            (params?: RestEndpointMethodTypes["git"]["getCommit"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["getCommit"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a single reference from your Git database. The `:ref` in the URL must be formatted as `heads/<branch name>` for branches and `tags/<tag name>` for tags. If the `:ref` doesn't match an existing ref, a `404` is returned.
         *
         * **Note:** You need to explicitly [request a pull request](https://docs.github.com/rest/reference/pulls#get-a-pull-request) to trigger a test merge commit, which checks the mergeability of pull requests. For more information, see "[Checking mergeability of pull requests](https://docs.github.com/rest/guides/getting-started-with-the-git-database-api#checking-mergeability-of-pull-requests)".
         */
        getRef: {
            (params?: RestEndpointMethodTypes["git"]["getRef"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["getRef"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Signature verification object**
         *
         * The response will include a `verification` object that describes the result of verifying the commit's signature. The following fields are included in the `verification` object:
         *
         * | Name | Type | Description |
         * | ---- | ---- | ----------- |
         * | `verified` | `boolean` | Indicates whether GitHub considers the signature in this commit to be verified. |
         * | `reason` | `string` | The reason for verified value. Possible values and their meanings are enumerated in table below. |
         * | `signature` | `string` | The signature that was extracted from the commit. |
         * | `payload` | `string` | The value that was signed. |
         *
         * These are the possible values for `reason` in the `verification` object:
         *
         * | Value | Description |
         * | ----- | ----------- |
         * | `expired_key` | The key that made the signature is expired. |
         * | `not_signing_key` | The "signing" flag is not among the usage flags in the GPG key that made the signature. |
         * | `gpgverify_error` | There was an error communicating with the signature verification service. |
         * | `gpgverify_unavailable` | The signature verification service is currently unavailable. |
         * | `unsigned` | The object does not include a signature. |
         * | `unknown_signature_type` | A non-PGP signature was found in the commit. |
         * | `no_user` | No user was associated with the `committer` email address in the commit. |
         * | `unverified_email` | The `committer` email address in the commit was associated with a user, but the email address is not verified on their account. |
         * | `bad_email` | The `committer` email address in the commit is not included in the identities of the PGP key that made the signature. |
         * | `unknown_key` | The key that made the signature has not been registered with any user's account. |
         * | `malformed_signature` | There was an error parsing the signature. |
         * | `invalid` | The signature could not be cryptographically verified using the key whose key-id was found in the signature. |
         * | `valid` | None of the above errors applied, so the signature is considered to be verified. |
         */
        getTag: {
            (params?: RestEndpointMethodTypes["git"]["getTag"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["getTag"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a single tree using the SHA1 value for that tree.
         *
         * If `truncated` is `true` in the response then the number of items in the `tree` array exceeded our maximum limit. If you need to fetch more items, use the non-recursive method of fetching trees, and fetch one sub-tree at a time.
         *
         *
         * **Note**: The limit for the `tree` array is 100,000 entries with a maximum size of 7 MB when using the `recursive` parameter.
         */
        getTree: {
            (params?: RestEndpointMethodTypes["git"]["getTree"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["getTree"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns an array of references from your Git database that match the supplied name. The `:ref` in the URL must be formatted as `heads/<branch name>` for branches and `tags/<tag name>` for tags. If the `:ref` doesn't exist in the repository, but existing refs start with `:ref`, they will be returned as an array.
         *
         * When you use this endpoint without providing a `:ref`, it will return an array of all the references from your Git database, including notes and stashes if they exist on the server. Anything in the namespace is returned, not just `heads` and `tags`.
         *
         * **Note:** You need to explicitly [request a pull request](https://docs.github.com/rest/reference/pulls#get-a-pull-request) to trigger a test merge commit, which checks the mergeability of pull requests. For more information, see "[Checking mergeability of pull requests](https://docs.github.com/rest/guides/getting-started-with-the-git-database-api#checking-mergeability-of-pull-requests)".
         *
         * If you request matching references for a branch named `feature` but the branch `feature` doesn't exist, the response can still include other matching head refs that start with the word `feature`, such as `featureA` and `featureB`.
         */
        listMatchingRefs: {
            (params?: RestEndpointMethodTypes["git"]["listMatchingRefs"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["listMatchingRefs"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        updateRef: {
            (params?: RestEndpointMethodTypes["git"]["updateRef"]["parameters"]): Promise<RestEndpointMethodTypes["git"]["updateRef"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    gitignore: {
        /**
         * List all templates available to pass as an option when [creating a repository](https://docs.github.com/rest/reference/repos#create-a-repository-for-the-authenticated-user).
         */
        getAllTemplates: {
            (params?: RestEndpointMethodTypes["gitignore"]["getAllTemplates"]["parameters"]): Promise<RestEndpointMethodTypes["gitignore"]["getAllTemplates"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * The API also allows fetching the source of a single template.
         * Use the raw [media type](https://docs.github.com/rest/overview/media-types/) to get the raw contents.
         */
        getTemplate: {
            (params?: RestEndpointMethodTypes["gitignore"]["getTemplate"]["parameters"]): Promise<RestEndpointMethodTypes["gitignore"]["getTemplate"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    interactions: {
        /**
         * Shows which type of GitHub user can interact with your public repositories and when the restriction expires.
         */
        getRestrictionsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["interactions"]["getRestrictionsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["getRestrictionsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Shows which type of GitHub user can interact with this organization and when the restriction expires. If there is no restrictions, you will see an empty response.
         */
        getRestrictionsForOrg: {
            (params?: RestEndpointMethodTypes["interactions"]["getRestrictionsForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["getRestrictionsForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Shows which type of GitHub user can interact with this repository and when the restriction expires. If there are no restrictions, you will see an empty response.
         */
        getRestrictionsForRepo: {
            (params?: RestEndpointMethodTypes["interactions"]["getRestrictionsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["getRestrictionsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Shows which type of GitHub user can interact with your public repositories and when the restriction expires.
         * @deprecated octokit.rest.interactions.getRestrictionsForYourPublicRepos() has been renamed to octokit.rest.interactions.getRestrictionsForAuthenticatedUser() (2021-02-02)
         */
        getRestrictionsForYourPublicRepos: {
            (params?: RestEndpointMethodTypes["interactions"]["getRestrictionsForYourPublicRepos"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["getRestrictionsForYourPublicRepos"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes any interaction restrictions from your public repositories.
         */
        removeRestrictionsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["interactions"]["removeRestrictionsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["removeRestrictionsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes all interaction restrictions from public repositories in the given organization. You must be an organization owner to remove restrictions.
         */
        removeRestrictionsForOrg: {
            (params?: RestEndpointMethodTypes["interactions"]["removeRestrictionsForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["removeRestrictionsForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes all interaction restrictions from the given repository. You must have owner or admin access to remove restrictions. If the interaction limit is set for the user or organization that owns this repository, you will receive a `409 Conflict` response and will not be able to use this endpoint to change the interaction limit for a single repository.
         */
        removeRestrictionsForRepo: {
            (params?: RestEndpointMethodTypes["interactions"]["removeRestrictionsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["removeRestrictionsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes any interaction restrictions from your public repositories.
         * @deprecated octokit.rest.interactions.removeRestrictionsForYourPublicRepos() has been renamed to octokit.rest.interactions.removeRestrictionsForAuthenticatedUser() (2021-02-02)
         */
        removeRestrictionsForYourPublicRepos: {
            (params?: RestEndpointMethodTypes["interactions"]["removeRestrictionsForYourPublicRepos"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["removeRestrictionsForYourPublicRepos"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Temporarily restricts which type of GitHub user can interact with your public repositories. Setting the interaction limit at the user level will overwrite any interaction limits that are set for individual repositories owned by the user.
         */
        setRestrictionsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["interactions"]["setRestrictionsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["setRestrictionsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Temporarily restricts interactions to a certain type of GitHub user in any public repository in the given organization. You must be an organization owner to set these restrictions. Setting the interaction limit at the organization level will overwrite any interaction limits that are set for individual repositories owned by the organization.
         */
        setRestrictionsForOrg: {
            (params?: RestEndpointMethodTypes["interactions"]["setRestrictionsForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["setRestrictionsForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Temporarily restricts interactions to a certain type of GitHub user within the given repository. You must have owner or admin access to set these restrictions. If an interaction limit is set for the user or organization that owns this repository, you will receive a `409 Conflict` response and will not be able to use this endpoint to change the interaction limit for a single repository.
         */
        setRestrictionsForRepo: {
            (params?: RestEndpointMethodTypes["interactions"]["setRestrictionsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["setRestrictionsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Temporarily restricts which type of GitHub user can interact with your public repositories. Setting the interaction limit at the user level will overwrite any interaction limits that are set for individual repositories owned by the user.
         * @deprecated octokit.rest.interactions.setRestrictionsForYourPublicRepos() has been renamed to octokit.rest.interactions.setRestrictionsForAuthenticatedUser() (2021-02-02)
         */
        setRestrictionsForYourPublicRepos: {
            (params?: RestEndpointMethodTypes["interactions"]["setRestrictionsForYourPublicRepos"]["parameters"]): Promise<RestEndpointMethodTypes["interactions"]["setRestrictionsForYourPublicRepos"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    issues: {
        /**
         * Adds up to 10 assignees to an issue. Users already assigned to an issue are not replaced.
         */
        addAssignees: {
            (params?: RestEndpointMethodTypes["issues"]["addAssignees"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["addAssignees"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Adds labels to an issue. If you provide an empty array of labels, all labels are removed from the issue.
         */
        addLabels: {
            (params?: RestEndpointMethodTypes["issues"]["addLabels"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["addLabels"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Checks if a user has permission to be assigned to an issue in this repository.
         *
         * If the `assignee` can be assigned to issues in the repository, a `204` header with no content is returned.
         *
         * Otherwise a `404` status code is returned.
         */
        checkUserCanBeAssigned: {
            (params?: RestEndpointMethodTypes["issues"]["checkUserCanBeAssigned"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["checkUserCanBeAssigned"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Checks if a user has permission to be assigned to a specific issue.
         *
         * If the `assignee` can be assigned to this issue, a `204` status code with no content is returned.
         *
         * Otherwise a `404` status code is returned.
         */
        checkUserCanBeAssignedToIssue: {
            (params?: RestEndpointMethodTypes["issues"]["checkUserCanBeAssignedToIssue"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["checkUserCanBeAssignedToIssue"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Any user with pull access to a repository can create an issue. If [issues are disabled in the repository](https://docs.github.com/articles/disabling-issues/), the API returns a `410 Gone` status.
         *
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         */
        create: {
            (params?: RestEndpointMethodTypes["issues"]["create"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["create"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You can use the REST API to create comments on issues and pull requests. Every pull request is an issue, but not every issue is a pull request.
         *
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications).
         * Creating content too quickly using this endpoint may result in secondary rate limiting.
         * See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)"
         * and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)"
         * for details.
         */
        createComment: {
            (params?: RestEndpointMethodTypes["issues"]["createComment"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["createComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a label for the specified repository with the given name and color. The name and color parameters are required. The color must be a valid [hexadecimal color code](http://www.color-hex.com/).
         */
        createLabel: {
            (params?: RestEndpointMethodTypes["issues"]["createLabel"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["createLabel"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a milestone.
         */
        createMilestone: {
            (params?: RestEndpointMethodTypes["issues"]["createMilestone"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["createMilestone"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You can use the REST API to delete comments on issues and pull requests. Every pull request is an issue, but not every issue is a pull request.
         */
        deleteComment: {
            (params?: RestEndpointMethodTypes["issues"]["deleteComment"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["deleteComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a label using the given label name.
         */
        deleteLabel: {
            (params?: RestEndpointMethodTypes["issues"]["deleteLabel"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["deleteLabel"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a milestone using the given milestone number.
         */
        deleteMilestone: {
            (params?: RestEndpointMethodTypes["issues"]["deleteMilestone"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["deleteMilestone"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * The API returns a [`301 Moved Permanently` status](https://docs.github.com/rest/overview/resources-in-the-rest-api#http-redirects-redirects) if the issue was
         * [transferred](https://docs.github.com/articles/transferring-an-issue-to-another-repository/) to another repository. If
         * the issue was transferred to or deleted from a repository where the authenticated user lacks read access, the API
         * returns a `404 Not Found` status. If the issue was deleted from a repository where the authenticated user has read
         * access, the API returns a `410 Gone` status. To receive webhook events for transferred and deleted issues, subscribe
         * to the [`issues`](https://docs.github.com/webhooks/event-payloads/#issues) webhook.
         *
         * **Note**: GitHub's REST API considers every pull request an issue, but not every issue is a pull request. For this
         * reason, "Issues" endpoints may return both issues and pull requests in the response. You can identify pull requests by
         * the `pull_request` key. Be aware that the `id` of a pull request returned from "Issues" endpoints will be an _issue id_. To find out the pull
         * request id, use the "[List pull requests](https://docs.github.com/rest/reference/pulls#list-pull-requests)" endpoint.
         */
        get: {
            (params?: RestEndpointMethodTypes["issues"]["get"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["get"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You can use the REST API to get comments on issues and pull requests. Every pull request is an issue, but not every issue is a pull request.
         */
        getComment: {
            (params?: RestEndpointMethodTypes["issues"]["getComment"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["getComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a single event by the event id.
         */
        getEvent: {
            (params?: RestEndpointMethodTypes["issues"]["getEvent"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["getEvent"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a label using the given name.
         */
        getLabel: {
            (params?: RestEndpointMethodTypes["issues"]["getLabel"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["getLabel"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a milestone using the given milestone number.
         */
        getMilestone: {
            (params?: RestEndpointMethodTypes["issues"]["getMilestone"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["getMilestone"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List issues assigned to the authenticated user across all visible repositories including owned repositories, member
         * repositories, and organization repositories. You can use the `filter` query parameter to fetch issues that are not
         * necessarily assigned to you.
         *
         *
         * **Note**: GitHub's REST API considers every pull request an issue, but not every issue is a pull request. For this
         * reason, "Issues" endpoints may return both issues and pull requests in the response. You can identify pull requests by
         * the `pull_request` key. Be aware that the `id` of a pull request returned from "Issues" endpoints will be an _issue id_. To find out the pull
         * request id, use the "[List pull requests](https://docs.github.com/rest/reference/pulls#list-pull-requests)" endpoint.
         */
        list: {
            (params?: RestEndpointMethodTypes["issues"]["list"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["list"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the [available assignees](https://docs.github.com/articles/assigning-issues-and-pull-requests-to-other-github-users/) for issues in a repository.
         */
        listAssignees: {
            (params?: RestEndpointMethodTypes["issues"]["listAssignees"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listAssignees"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You can use the REST API to list comments on issues and pull requests. Every pull request is an issue, but not every issue is a pull request.
         *
         * Issue comments are ordered by ascending ID.
         */
        listComments: {
            (params?: RestEndpointMethodTypes["issues"]["listComments"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listComments"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You can use the REST API to list comments on issues and pull requests for a repository. Every pull request is an issue, but not every issue is a pull request.
         *
         * By default, issue comments are ordered by ascending ID.
         */
        listCommentsForRepo: {
            (params?: RestEndpointMethodTypes["issues"]["listCommentsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listCommentsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all events for an issue.
         */
        listEvents: {
            (params?: RestEndpointMethodTypes["issues"]["listEvents"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listEvents"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists events for a repository.
         */
        listEventsForRepo: {
            (params?: RestEndpointMethodTypes["issues"]["listEventsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listEventsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all timeline events for an issue.
         */
        listEventsForTimeline: {
            (params?: RestEndpointMethodTypes["issues"]["listEventsForTimeline"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listEventsForTimeline"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List issues across owned and member repositories assigned to the authenticated user.
         *
         * **Note**: GitHub's REST API considers every pull request an issue, but not every issue is a pull request. For this
         * reason, "Issues" endpoints may return both issues and pull requests in the response. You can identify pull requests by
         * the `pull_request` key. Be aware that the `id` of a pull request returned from "Issues" endpoints will be an _issue id_. To find out the pull
         * request id, use the "[List pull requests](https://docs.github.com/rest/reference/pulls#list-pull-requests)" endpoint.
         */
        listForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["issues"]["listForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List issues in an organization assigned to the authenticated user.
         *
         * **Note**: GitHub's REST API considers every pull request an issue, but not every issue is a pull request. For this
         * reason, "Issues" endpoints may return both issues and pull requests in the response. You can identify pull requests by
         * the `pull_request` key. Be aware that the `id` of a pull request returned from "Issues" endpoints will be an _issue id_. To find out the pull
         * request id, use the "[List pull requests](https://docs.github.com/rest/reference/pulls#list-pull-requests)" endpoint.
         */
        listForOrg: {
            (params?: RestEndpointMethodTypes["issues"]["listForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List issues in a repository. Only open issues will be listed.
         *
         * **Note**: GitHub's REST API considers every pull request an issue, but not every issue is a pull request. For this
         * reason, "Issues" endpoints may return both issues and pull requests in the response. You can identify pull requests by
         * the `pull_request` key. Be aware that the `id` of a pull request returned from "Issues" endpoints will be an _issue id_. To find out the pull
         * request id, use the "[List pull requests](https://docs.github.com/rest/reference/pulls#list-pull-requests)" endpoint.
         */
        listForRepo: {
            (params?: RestEndpointMethodTypes["issues"]["listForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists labels for issues in a milestone.
         */
        listLabelsForMilestone: {
            (params?: RestEndpointMethodTypes["issues"]["listLabelsForMilestone"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listLabelsForMilestone"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all labels for a repository.
         */
        listLabelsForRepo: {
            (params?: RestEndpointMethodTypes["issues"]["listLabelsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listLabelsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all labels for an issue.
         */
        listLabelsOnIssue: {
            (params?: RestEndpointMethodTypes["issues"]["listLabelsOnIssue"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listLabelsOnIssue"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists milestones for a repository.
         */
        listMilestones: {
            (params?: RestEndpointMethodTypes["issues"]["listMilestones"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["listMilestones"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with push access can lock an issue or pull request's conversation.
         *
         * Note that, if you choose not to pass any parameters, you'll need to set `Content-Length` to zero when calling out to this endpoint. For more information, see "[HTTP verbs](https://docs.github.com/rest/overview/resources-in-the-rest-api#http-verbs)."
         */
        lock: {
            (params?: RestEndpointMethodTypes["issues"]["lock"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["lock"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes all labels from an issue.
         */
        removeAllLabels: {
            (params?: RestEndpointMethodTypes["issues"]["removeAllLabels"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["removeAllLabels"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes one or more assignees from an issue.
         */
        removeAssignees: {
            (params?: RestEndpointMethodTypes["issues"]["removeAssignees"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["removeAssignees"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes the specified label from the issue, and returns the remaining labels on the issue. This endpoint returns a `404 Not Found` status if the label does not exist.
         */
        removeLabel: {
            (params?: RestEndpointMethodTypes["issues"]["removeLabel"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["removeLabel"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes any previous labels and sets the new labels for an issue.
         */
        setLabels: {
            (params?: RestEndpointMethodTypes["issues"]["setLabels"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["setLabels"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with push access can unlock an issue's conversation.
         */
        unlock: {
            (params?: RestEndpointMethodTypes["issues"]["unlock"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["unlock"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Issue owners and users with push access can edit an issue.
         */
        update: {
            (params?: RestEndpointMethodTypes["issues"]["update"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["update"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You can use the REST API to update comments on issues and pull requests. Every pull request is an issue, but not every issue is a pull request.
         */
        updateComment: {
            (params?: RestEndpointMethodTypes["issues"]["updateComment"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["updateComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates a label using the given label name.
         */
        updateLabel: {
            (params?: RestEndpointMethodTypes["issues"]["updateLabel"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["updateLabel"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        updateMilestone: {
            (params?: RestEndpointMethodTypes["issues"]["updateMilestone"]["parameters"]): Promise<RestEndpointMethodTypes["issues"]["updateMilestone"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    licenses: {
        get: {
            (params?: RestEndpointMethodTypes["licenses"]["get"]["parameters"]): Promise<RestEndpointMethodTypes["licenses"]["get"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        getAllCommonlyUsed: {
            (params?: RestEndpointMethodTypes["licenses"]["getAllCommonlyUsed"]["parameters"]): Promise<RestEndpointMethodTypes["licenses"]["getAllCommonlyUsed"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This method returns the contents of the repository's license file, if one is detected.
         *
         * Similar to [Get repository content](https://docs.github.com/rest/reference/repos#get-repository-content), this method also supports [custom media types](https://docs.github.com/rest/overview/media-types) for retrieving the raw license content or rendered license HTML.
         */
        getForRepo: {
            (params?: RestEndpointMethodTypes["licenses"]["getForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["licenses"]["getForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    markdown: {
        render: {
            (params?: RestEndpointMethodTypes["markdown"]["render"]["parameters"]): Promise<RestEndpointMethodTypes["markdown"]["render"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You must send Markdown as plain text (using a `Content-Type` header of `text/plain` or `text/x-markdown`) to this endpoint, rather than using JSON format. In raw mode, [GitHub Flavored Markdown](https://github.github.com/gfm/) is not supported and Markdown will be rendered in plain format like a README.md file. Markdown content must be 400 KB or less.
         */
        renderRaw: {
            (params?: RestEndpointMethodTypes["markdown"]["renderRaw"]["parameters"]): Promise<RestEndpointMethodTypes["markdown"]["renderRaw"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    meta: {
        /**
         * Returns meta information about GitHub, including a list of GitHub's IP addresses. For more information, see "[About GitHub's IP addresses](https://docs.github.com/articles/about-github-s-ip-addresses/)."
         *
         * The API's response also includes a list of GitHub's domain names.
         *
         * The values shown in the documentation's response are example values. You must always query the API directly to get the latest values.
         *
         * **Note:** This endpoint returns both IPv4 and IPv6 addresses. However, not all features support IPv6. You should refer to the specific documentation for each feature to determine if IPv6 is supported.
         */
        get: {
            (params?: RestEndpointMethodTypes["meta"]["get"]["parameters"]): Promise<RestEndpointMethodTypes["meta"]["get"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get all supported GitHub API versions.
         */
        getAllVersions: {
            (params?: RestEndpointMethodTypes["meta"]["getAllVersions"]["parameters"]): Promise<RestEndpointMethodTypes["meta"]["getAllVersions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get the octocat as ASCII art
         */
        getOctocat: {
            (params?: RestEndpointMethodTypes["meta"]["getOctocat"]["parameters"]): Promise<RestEndpointMethodTypes["meta"]["getOctocat"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get a random sentence from the Zen of GitHub
         */
        getZen: {
            (params?: RestEndpointMethodTypes["meta"]["getZen"]["parameters"]): Promise<RestEndpointMethodTypes["meta"]["getZen"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get Hypermedia links to resources accessible in GitHub's REST API
         */
        root: {
            (params?: RestEndpointMethodTypes["meta"]["root"]["parameters"]): Promise<RestEndpointMethodTypes["meta"]["root"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    migrations: {
        /**
         * Stop an import for a repository.
         *
         * **Warning:** Support for importing Mercurial, Subversion and Team Foundation Version Control repositories will end
         * on October 17, 2023. For more details, see [changelog](https://gh.io/github-importer-non-git-eol). In the coming weeks, we will update
         * these docs to reflect relevant changes to the API and will contact all integrators using the "Source imports" API.
         */
        cancelImport: {
            (params?: RestEndpointMethodTypes["migrations"]["cancelImport"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["cancelImport"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a previous migration archive. Downloadable migration archives are automatically deleted after seven days. Migration metadata, which is returned in the [List user migrations](https://docs.github.com/rest/migrations/users#list-user-migrations) and [Get a user migration status](https://docs.github.com/rest/migrations/users#get-a-user-migration-status) endpoints, will continue to be available even after an archive is deleted.
         */
        deleteArchiveForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["migrations"]["deleteArchiveForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["deleteArchiveForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a previous migration archive. Migration archives are automatically deleted after seven days.
         */
        deleteArchiveForOrg: {
            (params?: RestEndpointMethodTypes["migrations"]["deleteArchiveForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["deleteArchiveForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Fetches the URL to a migration archive.
         */
        downloadArchiveForOrg: {
            (params?: RestEndpointMethodTypes["migrations"]["downloadArchiveForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["downloadArchiveForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Fetches the URL to download the migration archive as a `tar.gz` file. Depending on the resources your repository uses, the migration archive can contain JSON files with data for these objects:
         *
         * *   attachments
         * *   bases
         * *   commit\_comments
         * *   issue\_comments
         * *   issue\_events
         * *   issues
         * *   milestones
         * *   organizations
         * *   projects
         * *   protected\_branches
         * *   pull\_request\_reviews
         * *   pull\_requests
         * *   releases
         * *   repositories
         * *   review\_comments
         * *   schema
         * *   users
         *
         * The archive will also contain an `attachments` directory that includes all attachment files uploaded to GitHub.com and a `repositories` directory that contains the repository's Git data.
         */
        getArchiveForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["migrations"]["getArchiveForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["getArchiveForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Each type of source control system represents authors in a different way. For example, a Git commit author has a display name and an email address, but a Subversion commit author just has a username. The GitHub Importer will make the author information valid, but the author might not be correct. For example, it will change the bare Subversion username `hubot` into something like `hubot <hubot@12341234-abab-fefe-8787-fedcba987654>`.
         *
         * This endpoint and the [Map a commit author](https://docs.github.com/rest/migrations/source-imports#map-a-commit-author) endpoint allow you to provide correct Git author information.
         *
         * **Warning:** Support for importing Mercurial, Subversion and Team Foundation Version Control repositories will end
         * on October 17, 2023. For more details, see [changelog](https://gh.io/github-importer-non-git-eol). In the coming weeks, we will update
         * these docs to reflect relevant changes to the API and will contact all integrators using the "Source imports" API.
         */
        getCommitAuthors: {
            (params?: RestEndpointMethodTypes["migrations"]["getCommitAuthors"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["getCommitAuthors"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * View the progress of an import.
         *
         * **Warning:** Support for importing Mercurial, Subversion and Team Foundation Version Control repositories will end
         * on October 17, 2023. For more details, see [changelog](https://gh.io/github-importer-non-git-eol). In the coming weeks, we will update
         * these docs to reflect relevant changes to the API and will contact all integrators using the "Source imports" API.
         *
         * **Import status**
         *
         * This section includes details about the possible values of the `status` field of the Import Progress response.
         *
         * An import that does not have errors will progress through these steps:
         *
         * *   `detecting` - the "detection" step of the import is in progress because the request did not include a `vcs` parameter. The import is identifying the type of source control present at the URL.
         * *   `importing` - the "raw" step of the import is in progress. This is where commit data is fetched from the original repository. The import progress response will include `commit_count` (the total number of raw commits that will be imported) and `percent` (0 - 100, the current progress through the import).
         * *   `mapping` - the "rewrite" step of the import is in progress. This is where SVN branches are converted to Git branches, and where author updates are applied. The import progress response does not include progress information.
         * *   `pushing` - the "push" step of the import is in progress. This is where the importer updates the repository on GitHub. The import progress response will include `push_percent`, which is the percent value reported by `git push` when it is "Writing objects".
         * *   `complete` - the import is complete, and the repository is ready on GitHub.
         *
         * If there are problems, you will see one of these in the `status` field:
         *
         * *   `auth_failed` - the import requires authentication in order to connect to the original repository. To update authentication for the import, please see the [Update an import](https://docs.github.com/rest/migrations/source-imports#update-an-import) section.
         * *   `error` - the import encountered an error. The import progress response will include the `failed_step` and an error message. Contact [GitHub Support](https://support.github.com/contact?tags=dotcom-rest-api) for more information.
         * *   `detection_needs_auth` - the importer requires authentication for the originating repository to continue detection. To update authentication for the import, please see the [Update an import](https://docs.github.com/rest/migrations/source-imports#update-an-import) section.
         * *   `detection_found_nothing` - the importer didn't recognize any source control at the URL. To resolve, [Cancel the import](https://docs.github.com/rest/migrations/source-imports#cancel-an-import) and [retry](https://docs.github.com/rest/migrations/source-imports#start-an-import) with the correct URL.
         * *   `detection_found_multiple` - the importer found several projects or repositories at the provided URL. When this is the case, the Import Progress response will also include a `project_choices` field with the possible project choices as values. To update project choice, please see the [Update an import](https://docs.github.com/rest/migrations/source-imports#update-an-import) section.
         *
         * **The project_choices field**
         *
         * When multiple projects are found at the provided URL, the response hash will include a `project_choices` field, the value of which is an array of hashes each representing a project choice. The exact key/value pairs of the project hashes will differ depending on the version control type.
         *
         * **Git LFS related fields**
         *
         * This section includes details about Git LFS related fields that may be present in the Import Progress response.
         *
         * *   `use_lfs` - describes whether the import has been opted in or out of using Git LFS. The value can be `opt_in`, `opt_out`, or `undecided` if no action has been taken.
         * *   `has_large_files` - the boolean value describing whether files larger than 100MB were found during the `importing` step.
         * *   `large_files_size` - the total size in gigabytes of files larger than 100MB found in the originating repository.
         * *   `large_files_count` - the total number of files larger than 100MB found in the originating repository. To see a list of these files, make a "Get Large Files" request.
         */
        getImportStatus: {
            (params?: RestEndpointMethodTypes["migrations"]["getImportStatus"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["getImportStatus"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List files larger than 100MB found during the import
         *
         * **Warning:** Support for importing Mercurial, Subversion and Team Foundation Version Control repositories will end
         * on October 17, 2023. For more details, see [changelog](https://gh.io/github-importer-non-git-eol). In the coming weeks, we will update
         * these docs to reflect relevant changes to the API and will contact all integrators using the "Source imports" API.
         */
        getLargeFiles: {
            (params?: RestEndpointMethodTypes["migrations"]["getLargeFiles"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["getLargeFiles"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Fetches a single user migration. The response includes the `state` of the migration, which can be one of the following values:
         *
         * *   `pending` - the migration hasn't started yet.
         * *   `exporting` - the migration is in progress.
         * *   `exported` - the migration finished successfully.
         * *   `failed` - the migration failed.
         *
         * Once the migration has been `exported` you can [download the migration archive](https://docs.github.com/rest/migrations/users#download-a-user-migration-archive).
         */
        getStatusForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["migrations"]["getStatusForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["getStatusForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Fetches the status of a migration.
         *
         * The `state` of a migration can be one of the following values:
         *
         * *   `pending`, which means the migration hasn't started yet.
         * *   `exporting`, which means the migration is in progress.
         * *   `exported`, which means the migration finished successfully.
         * *   `failed`, which means the migration failed.
         */
        getStatusForOrg: {
            (params?: RestEndpointMethodTypes["migrations"]["getStatusForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["getStatusForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all migrations a user has started.
         */
        listForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["migrations"]["listForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["listForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the most recent migrations, including both exports (which can be started through the REST API) and imports (which cannot be started using the REST API).
         *
         * A list of `repositories` is only returned for export migrations.
         */
        listForOrg: {
            (params?: RestEndpointMethodTypes["migrations"]["listForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["listForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all the repositories for this user migration.
         */
        listReposForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["migrations"]["listReposForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["listReposForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all the repositories for this organization migration.
         */
        listReposForOrg: {
            (params?: RestEndpointMethodTypes["migrations"]["listReposForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["listReposForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all the repositories for this user migration.
         * @deprecated octokit.rest.migrations.listReposForUser() has been renamed to octokit.rest.migrations.listReposForAuthenticatedUser() (2021-10-05)
         */
        listReposForUser: {
            (params?: RestEndpointMethodTypes["migrations"]["listReposForUser"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["listReposForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Update an author's identity for the import. Your application can continue updating authors any time before you push
         * new commits to the repository.
         *
         * **Warning:** Support for importing Mercurial, Subversion and Team Foundation Version Control repositories will end
         * on October 17, 2023. For more details, see [changelog](https://gh.io/github-importer-non-git-eol). In the coming weeks, we will update
         * these docs to reflect relevant changes to the API and will contact all integrators using the "Source imports" API.
         */
        mapCommitAuthor: {
            (params?: RestEndpointMethodTypes["migrations"]["mapCommitAuthor"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["mapCommitAuthor"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You can import repositories from Subversion, Mercurial, and TFS that include files larger than 100MB. This ability
         * is powered by [Git LFS](https://git-lfs.com).
         *
         * You can learn more about our LFS feature and working with large files [on our help
         * site](https://docs.github.com/repositories/working-with-files/managing-large-files).
         *
         * **Warning:** Support for importing Mercurial, Subversion and Team Foundation Version Control repositories will end
         * on October 17, 2023. For more details, see [changelog](https://gh.io/github-importer-non-git-eol). In the coming weeks, we will update
         * these docs to reflect relevant changes to the API and will contact all integrators using the "Source imports" API.
         */
        setLfsPreference: {
            (params?: RestEndpointMethodTypes["migrations"]["setLfsPreference"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["setLfsPreference"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Initiates the generation of a user migration archive.
         */
        startForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["migrations"]["startForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["startForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Initiates the generation of a migration archive.
         */
        startForOrg: {
            (params?: RestEndpointMethodTypes["migrations"]["startForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["startForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Start a source import to a GitHub repository using GitHub Importer. Importing into a GitHub repository with GitHub Actions enabled is not supported and will return a status `422 Unprocessable Entity` response.
         * **Warning:** Support for importing Mercurial, Subversion and Team Foundation Version Control repositories will end on October 17, 2023. For more details, see [changelog](https://gh.io/github-importer-non-git-eol). In the coming weeks, we will update these docs to reflect relevant changes to the API and will contact all integrators using the "Source imports" API.
         */
        startImport: {
            (params?: RestEndpointMethodTypes["migrations"]["startImport"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["startImport"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Unlocks a repository. You can lock repositories when you [start a user migration](https://docs.github.com/rest/migrations/users#start-a-user-migration). Once the migration is complete you can unlock each repository to begin using it again or [delete the repository](https://docs.github.com/rest/repos/repos#delete-a-repository) if you no longer need the source data. Returns a status of `404 Not Found` if the repository is not locked.
         */
        unlockRepoForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["migrations"]["unlockRepoForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["unlockRepoForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Unlocks a repository that was locked for migration. You should unlock each migrated repository and [delete them](https://docs.github.com/rest/repos/repos#delete-a-repository) when the migration is complete and you no longer need the source data.
         */
        unlockRepoForOrg: {
            (params?: RestEndpointMethodTypes["migrations"]["unlockRepoForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["unlockRepoForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * An import can be updated with credentials or a project choice by passing in the appropriate parameters in this API
         * request. If no parameters are provided, the import will be restarted.
         *
         * Some servers (e.g. TFS servers) can have several projects at a single URL. In those cases the import progress will
         * have the status `detection_found_multiple` and the Import Progress response will include a `project_choices` array.
         * You can select the project to import by providing one of the objects in the `project_choices` array in the update request.
         *
         * **Warning:** Support for importing Mercurial, Subversion and Team Foundation Version Control repositories will end
         * on October 17, 2023. For more details, see [changelog](https://gh.io/github-importer-non-git-eol). In the coming weeks, we will update
         * these docs to reflect relevant changes to the API and will contact all integrators using the "Source imports" API.
         */
        updateImport: {
            (params?: RestEndpointMethodTypes["migrations"]["updateImport"]["parameters"]): Promise<RestEndpointMethodTypes["migrations"]["updateImport"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    orgs: {
        /**
         * Adds a team as a security manager for an organization. For more information, see "[Managing security for an organization](https://docs.github.com/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization) for an organization."
         *
         * To use this endpoint, you must be an administrator for the organization, and you must use an access token with the `write:org` scope.
         *
         * GitHub Apps must have the `administration` organization read-write permission to use this endpoint.
         */
        addSecurityManagerTeam: {
            (params?: RestEndpointMethodTypes["orgs"]["addSecurityManagerTeam"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["addSecurityManagerTeam"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        blockUser: {
            (params?: RestEndpointMethodTypes["orgs"]["blockUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["blockUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Cancel an organization invitation. In order to cancel an organization invitation, the authenticated user must be an organization owner.
         *
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications).
         */
        cancelInvitation: {
            (params?: RestEndpointMethodTypes["orgs"]["cancelInvitation"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["cancelInvitation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        checkBlockedUser: {
            (params?: RestEndpointMethodTypes["orgs"]["checkBlockedUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["checkBlockedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Check if a user is, publicly or privately, a member of the organization.
         */
        checkMembershipForUser: {
            (params?: RestEndpointMethodTypes["orgs"]["checkMembershipForUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["checkMembershipForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Check if the provided user is a public member of the organization.
         */
        checkPublicMembershipForUser: {
            (params?: RestEndpointMethodTypes["orgs"]["checkPublicMembershipForUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["checkPublicMembershipForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * When an organization member is converted to an outside collaborator, they'll only have access to the repositories that their current team membership allows. The user will no longer be a member of the organization. For more information, see "[Converting an organization member to an outside collaborator](https://docs.github.com/articles/converting-an-organization-member-to-an-outside-collaborator/)". Converting an organization member to an outside collaborator may be restricted by enterprise administrators. For more information, see "[Enforcing repository management policies in your enterprise](https://docs.github.com/admin/policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise#enforcing-a-policy-for-inviting-outside-collaborators-to-repositories)."
         */
        convertMemberToOutsideCollaborator: {
            (params?: RestEndpointMethodTypes["orgs"]["convertMemberToOutsideCollaborator"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["convertMemberToOutsideCollaborator"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Invite people to an organization by using their GitHub user ID or their email address. In order to create invitations in an organization, the authenticated user must be an organization owner.
         *
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         */
        createInvitation: {
            (params?: RestEndpointMethodTypes["orgs"]["createInvitation"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["createInvitation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Here's how you can create a hook that posts payloads in JSON format:
         */
        createWebhook: {
            (params?: RestEndpointMethodTypes["orgs"]["createWebhook"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["createWebhook"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes an organization and all its repositories.
         *
         * The organization login will be unavailable for 90 days after deletion.
         *
         * Please review the Terms of Service regarding account deletion before using this endpoint:
         *
         * https://docs.github.com/site-policy/github-terms/github-terms-of-service
         */
        delete: {
            (params?: RestEndpointMethodTypes["orgs"]["delete"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["delete"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        deleteWebhook: {
            (params?: RestEndpointMethodTypes["orgs"]["deleteWebhook"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["deleteWebhook"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Enables or disables the specified security feature for all eligible repositories in an organization.
         *
         * To use this endpoint, you must be an organization owner or be member of a team with the security manager role.
         * A token with the 'write:org' scope is also required.
         *
         * GitHub Apps must have the `organization_administration:write` permission to use this endpoint.
         *
         * For more information, see "[Managing security managers in your organization](https://docs.github.com/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization)."
         */
        enableOrDisableSecurityProductOnAllOrgRepos: {
            (params?: RestEndpointMethodTypes["orgs"]["enableOrDisableSecurityProductOnAllOrgRepos"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["enableOrDisableSecurityProductOnAllOrgRepos"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * To see many of the organization response values, you need to be an authenticated organization owner with the `admin:org` scope. When the value of `two_factor_requirement_enabled` is `true`, the organization requires all members, billing managers, and outside collaborators to enable [two-factor authentication](https://docs.github.com/articles/securing-your-account-with-two-factor-authentication-2fa/).
         *
         * GitHub Apps with the `Organization plan` permission can use this endpoint to retrieve information about an organization's GitHub plan. See "[Authenticating with GitHub Apps](https://docs.github.com/apps/building-github-apps/authenticating-with-github-apps/)" for details. For an example response, see 'Response with GitHub plan information' below."
         */
        get: {
            (params?: RestEndpointMethodTypes["orgs"]["get"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["get"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * If the authenticated user is an active or pending member of the organization, this endpoint will return the user's membership. If the authenticated user is not affiliated with the organization, a `404` is returned. This endpoint will return a `403` if the request is made by a GitHub App that is blocked by the organization.
         */
        getMembershipForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["orgs"]["getMembershipForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["getMembershipForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * In order to get a user's membership with an organization, the authenticated user must be an organization member. The `state` parameter in the response can be used to identify the user's membership status.
         */
        getMembershipForUser: {
            (params?: RestEndpointMethodTypes["orgs"]["getMembershipForUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["getMembershipForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a webhook configured in an organization. To get only the webhook `config` properties, see "[Get a webhook configuration for an organization](/rest/reference/orgs#get-a-webhook-configuration-for-an-organization)."
         */
        getWebhook: {
            (params?: RestEndpointMethodTypes["orgs"]["getWebhook"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["getWebhook"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns the webhook configuration for an organization. To get more information about the webhook, including the `active` state and `events`, use "[Get an organization webhook ](/rest/reference/orgs#get-an-organization-webhook)."
         *
         * Access tokens must have the `admin:org_hook` scope, and GitHub Apps must have the `organization_hooks:read` permission.
         */
        getWebhookConfigForOrg: {
            (params?: RestEndpointMethodTypes["orgs"]["getWebhookConfigForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["getWebhookConfigForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a delivery for a webhook configured in an organization.
         */
        getWebhookDelivery: {
            (params?: RestEndpointMethodTypes["orgs"]["getWebhookDelivery"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["getWebhookDelivery"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all organizations, in the order that they were created on GitHub.
         *
         * **Note:** Pagination is powered exclusively by the `since` parameter. Use the [Link header](https://docs.github.com/rest/guides/using-pagination-in-the-rest-api#using-link-headers) to get the URL for the next page of organizations.
         */
        list: {
            (params?: RestEndpointMethodTypes["orgs"]["list"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["list"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all GitHub Apps in an organization. The installation count includes all GitHub Apps installed on repositories in the organization. You must be an organization owner with `admin:read` scope to use this endpoint.
         */
        listAppInstallations: {
            (params?: RestEndpointMethodTypes["orgs"]["listAppInstallations"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listAppInstallations"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the users blocked by an organization.
         */
        listBlockedUsers: {
            (params?: RestEndpointMethodTypes["orgs"]["listBlockedUsers"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listBlockedUsers"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * The return hash contains `failed_at` and `failed_reason` fields which represent the time at which the invitation failed and the reason for the failure.
         */
        listFailedInvitations: {
            (params?: RestEndpointMethodTypes["orgs"]["listFailedInvitations"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listFailedInvitations"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List organizations for the authenticated user.
         *
         * **OAuth scope requirements**
         *
         * This only lists organizations that your authorization allows you to operate on in some way (e.g., you can list teams with `read:org` scope, you can publicize your organization membership with `user` scope, etc.). Therefore, this API requires at least `user` or `read:org` scope. OAuth requests with insufficient scope receive a `403 Forbidden` response.
         */
        listForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["orgs"]["listForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List [public organization memberships](https://docs.github.com/articles/publicizing-or-concealing-organization-membership) for the specified user.
         *
         * This method only lists _public_ memberships, regardless of authentication. If you need to fetch all of the organization memberships (public and private) for the authenticated user, use the [List organizations for the authenticated user](https://docs.github.com/rest/reference/orgs#list-organizations-for-the-authenticated-user) API instead.
         */
        listForUser: {
            (params?: RestEndpointMethodTypes["orgs"]["listForUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all teams associated with an invitation. In order to see invitations in an organization, the authenticated user must be an organization owner.
         */
        listInvitationTeams: {
            (params?: RestEndpointMethodTypes["orgs"]["listInvitationTeams"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listInvitationTeams"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all users who are members of an organization. If the authenticated user is also a member of this organization then both concealed and public members will be returned.
         */
        listMembers: {
            (params?: RestEndpointMethodTypes["orgs"]["listMembers"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listMembers"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all of the authenticated user's organization memberships.
         */
        listMembershipsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["orgs"]["listMembershipsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listMembershipsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all users who are outside collaborators of an organization.
         */
        listOutsideCollaborators: {
            (params?: RestEndpointMethodTypes["orgs"]["listOutsideCollaborators"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listOutsideCollaborators"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the repositories a fine-grained personal access token has access to. Only GitHub Apps can call this API,
         * using the `organization_personal_access_tokens: read` permission.
         *
         * **Note**: Fine-grained PATs are in public beta. Related APIs, events, and functionality are subject to change.
         */
        listPatGrantRepositories: {
            (params?: RestEndpointMethodTypes["orgs"]["listPatGrantRepositories"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listPatGrantRepositories"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the repositories a fine-grained personal access token request is requesting access to. Only GitHub Apps can call this API,
         * using the `organization_personal_access_token_requests: read` permission.
         *
         * **Note**: Fine-grained PATs are in public beta. Related APIs, events, and functionality are subject to change.
         */
        listPatGrantRequestRepositories: {
            (params?: RestEndpointMethodTypes["orgs"]["listPatGrantRequestRepositories"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listPatGrantRequestRepositories"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists requests from organization members to access organization resources with a fine-grained personal access token. Only GitHub Apps can call this API,
         * using the `organization_personal_access_token_requests: read` permission.
         *
         * **Note**: Fine-grained PATs are in public beta. Related APIs, events, and functionality are subject to change.
         */
        listPatGrantRequests: {
            (params?: RestEndpointMethodTypes["orgs"]["listPatGrantRequests"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listPatGrantRequests"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists approved fine-grained personal access tokens owned by organization members that can access organization resources. Only GitHub Apps can call this API,
         * using the `organization_personal_access_tokens: read` permission.
         *
         * **Note**: Fine-grained PATs are in public beta. Related APIs, events, and functionality are subject to change.
         */
        listPatGrants: {
            (params?: RestEndpointMethodTypes["orgs"]["listPatGrants"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listPatGrants"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * The return hash contains a `role` field which refers to the Organization Invitation role and will be one of the following values: `direct_member`, `admin`, `billing_manager`, or `hiring_manager`. If the invitee is not a GitHub member, the `login` field in the return hash will be `null`.
         */
        listPendingInvitations: {
            (params?: RestEndpointMethodTypes["orgs"]["listPendingInvitations"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listPendingInvitations"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Members of an organization can choose to have their membership publicized or not.
         */
        listPublicMembers: {
            (params?: RestEndpointMethodTypes["orgs"]["listPublicMembers"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listPublicMembers"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists teams that are security managers for an organization. For more information, see "[Managing security managers in your organization](https://docs.github.com/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization)."
         *
         * To use this endpoint, you must be an administrator or security manager for the organization, and you must use an access token with the `read:org` scope.
         *
         * GitHub Apps must have the `administration` organization read permission to use this endpoint.
         */
        listSecurityManagerTeams: {
            (params?: RestEndpointMethodTypes["orgs"]["listSecurityManagerTeams"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listSecurityManagerTeams"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a list of webhook deliveries for a webhook configured in an organization.
         */
        listWebhookDeliveries: {
            (params?: RestEndpointMethodTypes["orgs"]["listWebhookDeliveries"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listWebhookDeliveries"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listWebhooks: {
            (params?: RestEndpointMethodTypes["orgs"]["listWebhooks"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["listWebhooks"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This will trigger a [ping event](https://docs.github.com/webhooks/#ping-event) to be sent to the hook.
         */
        pingWebhook: {
            (params?: RestEndpointMethodTypes["orgs"]["pingWebhook"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["pingWebhook"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Redeliver a delivery for a webhook configured in an organization.
         */
        redeliverWebhookDelivery: {
            (params?: RestEndpointMethodTypes["orgs"]["redeliverWebhookDelivery"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["redeliverWebhookDelivery"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removing a user from this list will remove them from all teams and they will no longer have any access to the organization's repositories.
         */
        removeMember: {
            (params?: RestEndpointMethodTypes["orgs"]["removeMember"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["removeMember"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * In order to remove a user's membership with an organization, the authenticated user must be an organization owner.
         *
         * If the specified user is an active member of the organization, this will remove them from the organization. If the specified user has been invited to the organization, this will cancel their invitation. The specified user will receive an email notification in both cases.
         */
        removeMembershipForUser: {
            (params?: RestEndpointMethodTypes["orgs"]["removeMembershipForUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["removeMembershipForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removing a user from this list will remove them from all the organization's repositories.
         */
        removeOutsideCollaborator: {
            (params?: RestEndpointMethodTypes["orgs"]["removeOutsideCollaborator"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["removeOutsideCollaborator"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes the public membership for the authenticated user from the specified organization, unless public visibility is enforced by default.
         */
        removePublicMembershipForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["orgs"]["removePublicMembershipForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["removePublicMembershipForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes the security manager role from a team for an organization. For more information, see "[Managing security managers in your organization](https://docs.github.com/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization) team from an organization."
         *
         * To use this endpoint, you must be an administrator for the organization, and you must use an access token with the `admin:org` scope.
         *
         * GitHub Apps must have the `administration` organization read-write permission to use this endpoint.
         */
        removeSecurityManagerTeam: {
            (params?: RestEndpointMethodTypes["orgs"]["removeSecurityManagerTeam"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["removeSecurityManagerTeam"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Approves or denies a pending request to access organization resources via a fine-grained personal access token. Only GitHub Apps can call this API,
         * using the `organization_personal_access_token_requests: write` permission.
         *
         * **Note**: Fine-grained PATs are in public beta. Related APIs, events, and functionality are subject to change.
         */
        reviewPatGrantRequest: {
            (params?: RestEndpointMethodTypes["orgs"]["reviewPatGrantRequest"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["reviewPatGrantRequest"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Approves or denies multiple pending requests to access organization resources via a fine-grained personal access token. Only GitHub Apps can call this API,
         * using the `organization_personal_access_token_requests: write` permission.
         *
         * **Note**: Fine-grained PATs are in public beta. Related APIs, events, and functionality are subject to change.
         */
        reviewPatGrantRequestsInBulk: {
            (params?: RestEndpointMethodTypes["orgs"]["reviewPatGrantRequestsInBulk"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["reviewPatGrantRequestsInBulk"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Only authenticated organization owners can add a member to the organization or update the member's role.
         *
         * *   If the authenticated user is _adding_ a member to the organization, the invited user will receive an email inviting them to the organization. The user's [membership status](https://docs.github.com/rest/reference/orgs#get-organization-membership-for-a-user) will be `pending` until they accept the invitation.
         *
         * *   Authenticated users can _update_ a user's membership by passing the `role` parameter. If the authenticated user changes a member's role to `admin`, the affected user will receive an email notifying them that they've been made an organization owner. If the authenticated user changes an owner's role to `member`, no email will be sent.
         *
         * **Rate limits**
         *
         * To prevent abuse, the authenticated user is limited to 50 organization invitations per 24 hour period. If the organization is more than one month old or on a paid plan, the limit is 500 invitations per 24 hour period.
         */
        setMembershipForUser: {
            (params?: RestEndpointMethodTypes["orgs"]["setMembershipForUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["setMembershipForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * The user can publicize their own membership. (A user cannot publicize the membership for another user.)
         *
         * Note that you'll need to set `Content-Length` to zero when calling out to this endpoint. For more information, see "[HTTP verbs](https://docs.github.com/rest/overview/resources-in-the-rest-api#http-verbs)."
         */
        setPublicMembershipForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["orgs"]["setPublicMembershipForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["setPublicMembershipForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        unblockUser: {
            (params?: RestEndpointMethodTypes["orgs"]["unblockUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["unblockUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Parameter Deprecation Notice:** GitHub will replace and discontinue `members_allowed_repository_creation_type` in favor of more granular permissions. The new input parameters are `members_can_create_public_repositories`, `members_can_create_private_repositories` for all organizations and `members_can_create_internal_repositories` for organizations associated with an enterprise account using GitHub Enterprise Cloud or GitHub Enterprise Server 2.20+. For more information, see the [blog post](https://developer.github.com/changes/2019-12-03-internal-visibility-changes).
         *
         * Enables an authenticated organization owner with the `admin:org` scope or the `repo` scope to update the organization's profile and member privileges.
         */
        update: {
            (params?: RestEndpointMethodTypes["orgs"]["update"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["update"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Converts the authenticated user to an active member of the organization, if that user has a pending invitation from the organization.
         */
        updateMembershipForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["orgs"]["updateMembershipForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["updateMembershipForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates the access an organization member has to organization resources via a fine-grained personal access token. Limited to revoking the token's existing access. Limited to revoking a token's existing access. Only GitHub Apps can call this API,
         * using the `organization_personal_access_tokens: write` permission.
         *
         * **Note**: Fine-grained PATs are in public beta. Related APIs, events, and functionality are subject to change.
         */
        updatePatAccess: {
            (params?: RestEndpointMethodTypes["orgs"]["updatePatAccess"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["updatePatAccess"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates the access organization members have to organization resources via fine-grained personal access tokens. Limited to revoking a token's existing access. Only GitHub Apps can call this API,
         * using the `organization_personal_access_tokens: write` permission.
         *
         * **Note**: Fine-grained PATs are in public beta. Related APIs, events, and functionality are subject to change.
         */
        updatePatAccesses: {
            (params?: RestEndpointMethodTypes["orgs"]["updatePatAccesses"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["updatePatAccesses"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates a webhook configured in an organization. When you update a webhook, the `secret` will be overwritten. If you previously had a `secret` set, you must provide the same `secret` or set a new `secret` or the secret will be removed. If you are only updating individual webhook `config` properties, use "[Update a webhook configuration for an organization](/rest/reference/orgs#update-a-webhook-configuration-for-an-organization)."
         */
        updateWebhook: {
            (params?: RestEndpointMethodTypes["orgs"]["updateWebhook"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["updateWebhook"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates the webhook configuration for an organization. To update more information about the webhook, including the `active` state and `events`, use "[Update an organization webhook ](/rest/reference/orgs#update-an-organization-webhook)."
         *
         * Access tokens must have the `admin:org_hook` scope, and GitHub Apps must have the `organization_hooks:write` permission.
         */
        updateWebhookConfigForOrg: {
            (params?: RestEndpointMethodTypes["orgs"]["updateWebhookConfigForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["orgs"]["updateWebhookConfigForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    packages: {
        /**
         * Deletes a package owned by the authenticated user. You cannot delete a public package if any version of the package has more than 5,000 downloads. In this scenario, contact GitHub support for further assistance.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` and `delete:packages` scopes.
         * If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        deletePackageForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["packages"]["deletePackageForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["deletePackageForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes an entire package in an organization. You cannot delete a public package if any version of the package has more than 5,000 downloads. In this scenario, contact GitHub support for further assistance.
         *
         * To use this endpoint, you must have admin permissions in the organization and authenticate using an access token with the `read:packages` and `delete:packages` scopes. In addition:
         * - If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         * - If the `package_type` belongs to a GitHub Packages registry that supports granular permissions, you must have admin permissions to the package you want to delete. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#granular-permissions-for-userorganization-scoped-packages)."
         */
        deletePackageForOrg: {
            (params?: RestEndpointMethodTypes["packages"]["deletePackageForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["deletePackageForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes an entire package for a user. You cannot delete a public package if any version of the package has more than 5,000 downloads. In this scenario, contact GitHub support for further assistance.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` and `delete:packages` scopes. In addition:
         * - If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         * - If the `package_type` belongs to a GitHub Packages registry that supports granular permissions, you must have admin permissions to the package you want to delete. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#granular-permissions-for-userorganization-scoped-packages)."
         */
        deletePackageForUser: {
            (params?: RestEndpointMethodTypes["packages"]["deletePackageForUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["deletePackageForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a specific package version for a package owned by the authenticated user.  If the package is public and the package version has more than 5,000 downloads, you cannot delete the package version. In this scenario, contact GitHub support for further assistance.
         *
         * To use this endpoint, you must have admin permissions in the organization and authenticate using an access token with the `read:packages` and `delete:packages` scopes.
         * If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        deletePackageVersionForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["packages"]["deletePackageVersionForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["deletePackageVersionForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a specific package version in an organization. If the package is public and the package version has more than 5,000 downloads, you cannot delete the package version. In this scenario, contact GitHub support for further assistance.
         *
         * To use this endpoint, you must have admin permissions in the organization and authenticate using an access token with the `read:packages` and `delete:packages` scopes. In addition:
         * - If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         * - If the `package_type` belongs to a GitHub Packages registry that supports granular permissions, you must have admin permissions to the package whose version you want to delete. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#granular-permissions-for-userorganization-scoped-packages)."
         */
        deletePackageVersionForOrg: {
            (params?: RestEndpointMethodTypes["packages"]["deletePackageVersionForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["deletePackageVersionForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a specific package version for a user. If the package is public and the package version has more than 5,000 downloads, you cannot delete the package version. In this scenario, contact GitHub support for further assistance.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` and `delete:packages` scopes. In addition:
         * - If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         * - If the `package_type` belongs to a GitHub Packages registry that supports granular permissions, you must have admin permissions to the package whose version you want to delete. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#granular-permissions-for-userorganization-scoped-packages)."
         */
        deletePackageVersionForUser: {
            (params?: RestEndpointMethodTypes["packages"]["deletePackageVersionForUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["deletePackageVersionForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists package versions for a package owned by an organization.
         *
         * If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         * @deprecated octokit.rest.packages.getAllPackageVersionsForAPackageOwnedByAnOrg() has been renamed to octokit.rest.packages.getAllPackageVersionsForPackageOwnedByOrg() (2021-03-24)
         */
        getAllPackageVersionsForAPackageOwnedByAnOrg: {
            (params?: RestEndpointMethodTypes["packages"]["getAllPackageVersionsForAPackageOwnedByAnOrg"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["getAllPackageVersionsForAPackageOwnedByAnOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists package versions for a package owned by the authenticated user.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         * @deprecated octokit.rest.packages.getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser() has been renamed to octokit.rest.packages.getAllPackageVersionsForPackageOwnedByAuthenticatedUser() (2021-03-24)
         */
        getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["packages"]["getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists package versions for a package owned by the authenticated user.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        getAllPackageVersionsForPackageOwnedByAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["packages"]["getAllPackageVersionsForPackageOwnedByAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["getAllPackageVersionsForPackageOwnedByAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists package versions for a package owned by an organization.
         *
         * If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        getAllPackageVersionsForPackageOwnedByOrg: {
            (params?: RestEndpointMethodTypes["packages"]["getAllPackageVersionsForPackageOwnedByOrg"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["getAllPackageVersionsForPackageOwnedByOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists package versions for a public package owned by a specified user.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        getAllPackageVersionsForPackageOwnedByUser: {
            (params?: RestEndpointMethodTypes["packages"]["getAllPackageVersionsForPackageOwnedByUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["getAllPackageVersionsForPackageOwnedByUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific package for a package owned by the authenticated user.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        getPackageForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["packages"]["getPackageForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["getPackageForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific package in an organization.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        getPackageForOrganization: {
            (params?: RestEndpointMethodTypes["packages"]["getPackageForOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["getPackageForOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific package metadata for a public package owned by a user.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        getPackageForUser: {
            (params?: RestEndpointMethodTypes["packages"]["getPackageForUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["getPackageForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific package version for a package owned by the authenticated user.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        getPackageVersionForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["packages"]["getPackageVersionForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["getPackageVersionForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific package version in an organization.
         *
         * You must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        getPackageVersionForOrganization: {
            (params?: RestEndpointMethodTypes["packages"]["getPackageVersionForOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["getPackageVersionForOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a specific package version for a public package owned by a specified user.
         *
         * At this time, to use this endpoint, you must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        getPackageVersionForUser: {
            (params?: RestEndpointMethodTypes["packages"]["getPackageVersionForUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["getPackageVersionForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all packages that are owned by the authenticated user within the user's namespace, and that encountered a conflict during a Docker migration.
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope.
         */
        listDockerMigrationConflictingPackagesForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["packages"]["listDockerMigrationConflictingPackagesForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["listDockerMigrationConflictingPackagesForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all packages that are in a specific organization, are readable by the requesting user, and that encountered a conflict during a Docker migration.
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope.
         */
        listDockerMigrationConflictingPackagesForOrganization: {
            (params?: RestEndpointMethodTypes["packages"]["listDockerMigrationConflictingPackagesForOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["listDockerMigrationConflictingPackagesForOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all packages that are in a specific user's namespace, that the requesting user has access to, and that encountered a conflict during Docker migration.
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope.
         */
        listDockerMigrationConflictingPackagesForUser: {
            (params?: RestEndpointMethodTypes["packages"]["listDockerMigrationConflictingPackagesForUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["listDockerMigrationConflictingPackagesForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists packages owned by the authenticated user within the user's namespace.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        listPackagesForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["packages"]["listPackagesForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["listPackagesForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists packages in an organization readable by the user.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        listPackagesForOrganization: {
            (params?: RestEndpointMethodTypes["packages"]["listPackagesForOrganization"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["listPackagesForOrganization"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all packages in a user's namespace for which the requesting user has access.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` scope. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        listPackagesForUser: {
            (params?: RestEndpointMethodTypes["packages"]["listPackagesForUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["listPackagesForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Restores a package owned by the authenticated user.
         *
         * You can restore a deleted package under the following conditions:
         *   - The package was deleted within the last 30 days.
         *   - The same package namespace and version is still available and not reused for a new package. If the same package namespace is not available, you will not be able to restore your package. In this scenario, to restore the deleted package, you must delete the new package that uses the deleted package's namespace first.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` and `write:packages` scopes. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        restorePackageForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["packages"]["restorePackageForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["restorePackageForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Restores an entire package in an organization.
         *
         * You can restore a deleted package under the following conditions:
         *   - The package was deleted within the last 30 days.
         *   - The same package namespace and version is still available and not reused for a new package. If the same package namespace is not available, you will not be able to restore your package. In this scenario, to restore the deleted package, you must delete the new package that uses the deleted package's namespace first.
         *
         * To use this endpoint, you must have admin permissions in the organization and authenticate using an access token with the `read:packages` and `write:packages` scopes. In addition:
         * - If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         * - If the `package_type` belongs to a GitHub Packages registry that supports granular permissions, you must have admin permissions to the package you want to restore. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#granular-permissions-for-userorganization-scoped-packages)."
         */
        restorePackageForOrg: {
            (params?: RestEndpointMethodTypes["packages"]["restorePackageForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["restorePackageForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Restores an entire package for a user.
         *
         * You can restore a deleted package under the following conditions:
         *   - The package was deleted within the last 30 days.
         *   - The same package namespace and version is still available and not reused for a new package. If the same package namespace is not available, you will not be able to restore your package. In this scenario, to restore the deleted package, you must delete the new package that uses the deleted package's namespace first.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` and `write:packages` scopes. In addition:
         * - If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         * - If the `package_type` belongs to a GitHub Packages registry that supports granular permissions, you must have admin permissions to the package you want to restore. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#granular-permissions-for-userorganization-scoped-packages)."
         */
        restorePackageForUser: {
            (params?: RestEndpointMethodTypes["packages"]["restorePackageForUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["restorePackageForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Restores a package version owned by the authenticated user.
         *
         * You can restore a deleted package version under the following conditions:
         *   - The package was deleted within the last 30 days.
         *   - The same package namespace and version is still available and not reused for a new package. If the same package namespace is not available, you will not be able to restore your package. In this scenario, to restore the deleted package, you must delete the new package that uses the deleted package's namespace first.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` and `write:packages` scopes. If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of GitHub Packages registries that only support repository-scoped permissions, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         */
        restorePackageVersionForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["packages"]["restorePackageVersionForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["restorePackageVersionForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Restores a specific package version in an organization.
         *
         * You can restore a deleted package under the following conditions:
         *   - The package was deleted within the last 30 days.
         *   - The same package namespace and version is still available and not reused for a new package. If the same package namespace is not available, you will not be able to restore your package. In this scenario, to restore the deleted package, you must delete the new package that uses the deleted package's namespace first.
         *
         * To use this endpoint, you must have admin permissions in the organization and authenticate using an access token with the `read:packages` and `write:packages` scopes. In addition:
         * - If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         * - If the `package_type` belongs to a GitHub Packages registry that supports granular permissions, you must have admin permissions to the package whose version you want to restore. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#granular-permissions-for-userorganization-scoped-packages)."
         */
        restorePackageVersionForOrg: {
            (params?: RestEndpointMethodTypes["packages"]["restorePackageVersionForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["restorePackageVersionForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Restores a specific package version for a user.
         *
         * You can restore a deleted package under the following conditions:
         *   - The package was deleted within the last 30 days.
         *   - The same package namespace and version is still available and not reused for a new package. If the same package namespace is not available, you will not be able to restore your package. In this scenario, to restore the deleted package, you must delete the new package that uses the deleted package's namespace first.
         *
         * To use this endpoint, you must authenticate using an access token with the `read:packages` and `write:packages` scopes. In addition:
         * - If the `package_type` belongs to a GitHub Packages registry that only supports repository-scoped permissions, your token must also include the `repo` scope. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#permissions-for-repository-scoped-packages)."
         * - If the `package_type` belongs to a GitHub Packages registry that supports granular permissions, you must have admin permissions to the package whose version you want to restore. For the list of these registries, see "[About permissions for GitHub Packages](https://docs.github.com/packages/learn-github-packages/about-permissions-for-github-packages#granular-permissions-for-userorganization-scoped-packages)."
         */
        restorePackageVersionForUser: {
            (params?: RestEndpointMethodTypes["packages"]["restorePackageVersionForUser"]["parameters"]): Promise<RestEndpointMethodTypes["packages"]["restorePackageVersionForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    projects: {
        /**
         * Adds a collaborator to an organization project and sets their permission level. You must be an organization owner or a project `admin` to add a collaborator.
         */
        addCollaborator: {
            (params?: RestEndpointMethodTypes["projects"]["addCollaborator"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["addCollaborator"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        createCard: {
            (params?: RestEndpointMethodTypes["projects"]["createCard"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["createCard"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a new project column.
         */
        createColumn: {
            (params?: RestEndpointMethodTypes["projects"]["createColumn"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["createColumn"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a user project board. Returns a `410 Gone` status if the user does not have existing classic projects. If you do not have sufficient privileges to perform this action, a `401 Unauthorized` or `410 Gone` status is returned.
         */
        createForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["projects"]["createForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["createForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates an organization project board. Returns a `410 Gone` status if projects are disabled in the organization or if the organization does not have existing classic projects. If you do not have sufficient privileges to perform this action, a `401 Unauthorized` or `410 Gone` status is returned.
         */
        createForOrg: {
            (params?: RestEndpointMethodTypes["projects"]["createForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["createForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a repository project board. Returns a `410 Gone` status if projects are disabled in the repository or if the repository does not have existing classic projects. If you do not have sufficient privileges to perform this action, a `401 Unauthorized` or `410 Gone` status is returned.
         */
        createForRepo: {
            (params?: RestEndpointMethodTypes["projects"]["createForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["createForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a project board. Returns a `404 Not Found` status if projects are disabled.
         */
        delete: {
            (params?: RestEndpointMethodTypes["projects"]["delete"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["delete"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a project card
         */
        deleteCard: {
            (params?: RestEndpointMethodTypes["projects"]["deleteCard"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["deleteCard"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a project column.
         */
        deleteColumn: {
            (params?: RestEndpointMethodTypes["projects"]["deleteColumn"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["deleteColumn"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a project by its `id`. Returns a `404 Not Found` status if projects are disabled. If you do not have sufficient privileges to perform this action, a `401 Unauthorized` or `410 Gone` status is returned.
         */
        get: {
            (params?: RestEndpointMethodTypes["projects"]["get"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["get"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets information about a project card.
         */
        getCard: {
            (params?: RestEndpointMethodTypes["projects"]["getCard"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["getCard"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets information about a project column.
         */
        getColumn: {
            (params?: RestEndpointMethodTypes["projects"]["getColumn"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["getColumn"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns the collaborator's permission level for an organization project. Possible values for the `permission` key: `admin`, `write`, `read`, `none`. You must be an organization owner or a project `admin` to review a user's permission level.
         */
        getPermissionForUser: {
            (params?: RestEndpointMethodTypes["projects"]["getPermissionForUser"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["getPermissionForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the project cards in a project.
         */
        listCards: {
            (params?: RestEndpointMethodTypes["projects"]["listCards"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["listCards"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the collaborators for an organization project. For a project, the list of collaborators includes outside collaborators, organization members that are direct collaborators, organization members with access through team memberships, organization members with access through default organization permissions, and organization owners. You must be an organization owner or a project `admin` to list collaborators.
         */
        listCollaborators: {
            (params?: RestEndpointMethodTypes["projects"]["listCollaborators"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["listCollaborators"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the project columns in a project.
         */
        listColumns: {
            (params?: RestEndpointMethodTypes["projects"]["listColumns"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["listColumns"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the projects in an organization. Returns a `404 Not Found` status if projects are disabled in the organization. If you do not have sufficient privileges to perform this action, a `401 Unauthorized` or `410 Gone` status is returned.
         */
        listForOrg: {
            (params?: RestEndpointMethodTypes["projects"]["listForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["listForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the projects in a repository. Returns a `404 Not Found` status if projects are disabled in the repository. If you do not have sufficient privileges to perform this action, a `401 Unauthorized` or `410 Gone` status is returned.
         */
        listForRepo: {
            (params?: RestEndpointMethodTypes["projects"]["listForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["listForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists projects for a user.
         */
        listForUser: {
            (params?: RestEndpointMethodTypes["projects"]["listForUser"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["listForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        moveCard: {
            (params?: RestEndpointMethodTypes["projects"]["moveCard"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["moveCard"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        moveColumn: {
            (params?: RestEndpointMethodTypes["projects"]["moveColumn"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["moveColumn"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a collaborator from an organization project. You must be an organization owner or a project `admin` to remove a collaborator.
         */
        removeCollaborator: {
            (params?: RestEndpointMethodTypes["projects"]["removeCollaborator"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["removeCollaborator"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates a project board's information. Returns a `404 Not Found` status if projects are disabled. If you do not have sufficient privileges to perform this action, a `401 Unauthorized` or `410 Gone` status is returned.
         */
        update: {
            (params?: RestEndpointMethodTypes["projects"]["update"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["update"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        updateCard: {
            (params?: RestEndpointMethodTypes["projects"]["updateCard"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["updateCard"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        updateColumn: {
            (params?: RestEndpointMethodTypes["projects"]["updateColumn"]["parameters"]): Promise<RestEndpointMethodTypes["projects"]["updateColumn"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    pulls: {
        /**
         * Checks if a pull request has been merged into the base branch. The HTTP status of the response indicates whether or not the pull request has been merged; the response body is empty.
         */
        checkIfMerged: {
            (params?: RestEndpointMethodTypes["pulls"]["checkIfMerged"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["checkIfMerged"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Draft pull requests are available in public repositories with GitHub Free and GitHub Free for organizations, GitHub Pro, and legacy per-repository billing plans, and in public and private repositories with GitHub Team and GitHub Enterprise Cloud. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * To open or update a pull request in a public repository, you must have write access to the head or the source branch. For organization-owned repositories, you must be a member of the organization that owns the repository to open or update a pull request.
         *
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-rate-limits)" for details.
         */
        create: {
            (params?: RestEndpointMethodTypes["pulls"]["create"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["create"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a reply to a review comment for a pull request. For the `comment_id`, provide the ID of the review comment you are replying to. This must be the ID of a _top-level review comment_, not a reply to that comment. Replies to replies are not supported.
         *
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         */
        createReplyForReviewComment: {
            (params?: RestEndpointMethodTypes["pulls"]["createReplyForReviewComment"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["createReplyForReviewComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         *
         * Pull request reviews created in the `PENDING` state are not submitted and therefore do not include the `submitted_at` property in the response. To create a pending review for a pull request, leave the `event` parameter blank. For more information about submitting a `PENDING` review, see "[Submit a review for a pull request](https://docs.github.com/rest/pulls#submit-a-review-for-a-pull-request)."
         *
         * **Note:** To comment on a specific line in a file, you need to first determine the _position_ of that line in the diff. The GitHub REST API offers the `application/vnd.github.v3.diff` [media type](https://docs.github.com/rest/overview/media-types#commits-commit-comparison-and-pull-requests). To see a pull request diff, add this media type to the `Accept` header of a call to the [single pull request](https://docs.github.com/rest/reference/pulls#get-a-pull-request) endpoint.
         *
         * The `position` value equals the number of lines down from the first "@@" hunk header in the file you want to add a comment. The line just below the "@@" line is position 1, the next line is position 2, and so on. The position in the diff continues to increase through lines of whitespace and additional hunks until the beginning of a new file.
         */
        createReview: {
            (params?: RestEndpointMethodTypes["pulls"]["createReview"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["createReview"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a review comment in the pull request diff. To add a regular comment to a pull request timeline, see "[Create an issue comment](https://docs.github.com/rest/reference/issues#create-an-issue-comment)." We recommend creating a review comment using `line`, `side`, and optionally `start_line` and `start_side` if your comment applies to more than one line in the pull request diff.
         *
         * The `position` parameter is deprecated. If you use `position`, the `line`, `side`, `start_line`, and `start_side` parameters are not required.
         *
         * **Note:** The position value equals the number of lines down from the first "@@" hunk header in the file you want to add a comment. The line just below the "@@" line is position 1, the next line is position 2, and so on. The position in the diff continues to increase through lines of whitespace and additional hunks until the beginning of a new file.
         *
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         */
        createReviewComment: {
            (params?: RestEndpointMethodTypes["pulls"]["createReviewComment"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["createReviewComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a pull request review that has not been submitted. Submitted reviews cannot be deleted.
         */
        deletePendingReview: {
            (params?: RestEndpointMethodTypes["pulls"]["deletePendingReview"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["deletePendingReview"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a review comment.
         */
        deleteReviewComment: {
            (params?: RestEndpointMethodTypes["pulls"]["deleteReviewComment"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["deleteReviewComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** To dismiss a pull request review on a [protected branch](https://docs.github.com/rest/reference/repos#branches), you must be a repository administrator or be included in the list of people or teams who can dismiss pull request reviews.
         */
        dismissReview: {
            (params?: RestEndpointMethodTypes["pulls"]["dismissReview"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["dismissReview"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Draft pull requests are available in public repositories with GitHub Free and GitHub Free for organizations, GitHub Pro, and legacy per-repository billing plans, and in public and private repositories with GitHub Team and GitHub Enterprise Cloud. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Lists details of a pull request by providing its number.
         *
         * When you get, [create](https://docs.github.com/rest/reference/pulls/#create-a-pull-request), or [edit](https://docs.github.com/rest/reference/pulls#update-a-pull-request) a pull request, GitHub creates a merge commit to test whether the pull request can be automatically merged into the base branch. This test commit is not added to the base branch or the head branch. You can review the status of the test commit using the `mergeable` key. For more information, see "[Checking mergeability of pull requests](https://docs.github.com/rest/guides/getting-started-with-the-git-database-api#checking-mergeability-of-pull-requests)".
         *
         * The value of the `mergeable` attribute can be `true`, `false`, or `null`. If the value is `null`, then GitHub has started a background job to compute the mergeability. After giving the job time to complete, resubmit the request. When the job finishes, you will see a non-`null` value for the `mergeable` attribute in the response. If `mergeable` is `true`, then `merge_commit_sha` will be the SHA of the _test_ merge commit.
         *
         * The value of the `merge_commit_sha` attribute changes depending on the state of the pull request. Before merging a pull request, the `merge_commit_sha` attribute holds the SHA of the _test_ merge commit. After merging a pull request, the `merge_commit_sha` attribute changes depending on how you merged the pull request:
         *
         * *   If merged as a [merge commit](https://docs.github.com/articles/about-merge-methods-on-github/), `merge_commit_sha` represents the SHA of the merge commit.
         * *   If merged via a [squash](https://docs.github.com/articles/about-merge-methods-on-github/#squashing-your-merge-commits), `merge_commit_sha` represents the SHA of the squashed commit on the base branch.
         * *   If [rebased](https://docs.github.com/articles/about-merge-methods-on-github/#rebasing-and-merging-your-commits), `merge_commit_sha` represents the commit that the base branch was updated to.
         *
         * Pass the appropriate [media type](https://docs.github.com/rest/overview/media-types/#commits-commit-comparison-and-pull-requests) to fetch diff and patch formats.
         */
        get: {
            (params?: RestEndpointMethodTypes["pulls"]["get"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["get"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Retrieves a pull request review by its ID.
         */
        getReview: {
            (params?: RestEndpointMethodTypes["pulls"]["getReview"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["getReview"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Provides details for a review comment.
         */
        getReviewComment: {
            (params?: RestEndpointMethodTypes["pulls"]["getReviewComment"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["getReviewComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Draft pull requests are available in public repositories with GitHub Free and GitHub Free for organizations, GitHub Pro, and legacy per-repository billing plans, and in public and private repositories with GitHub Team and GitHub Enterprise Cloud. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        list: {
            (params?: RestEndpointMethodTypes["pulls"]["list"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["list"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List comments for a specific pull request review.
         */
        listCommentsForReview: {
            (params?: RestEndpointMethodTypes["pulls"]["listCommentsForReview"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["listCommentsForReview"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists a maximum of 250 commits for a pull request. To receive a complete commit list for pull requests with more than 250 commits, use the [List commits](https://docs.github.com/rest/reference/repos#list-commits) endpoint.
         */
        listCommits: {
            (params?: RestEndpointMethodTypes["pulls"]["listCommits"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["listCommits"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** Responses include a maximum of 3000 files. The paginated response returns 30 files per page by default.
         */
        listFiles: {
            (params?: RestEndpointMethodTypes["pulls"]["listFiles"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["listFiles"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the users or teams whose review is requested for a pull request. Once a requested reviewer submits a review, they are no longer considered a requested reviewer. Their review will instead be returned by the [List reviews for a pull request](https://docs.github.com/rest/pulls/reviews#list-reviews-for-a-pull-request) operation.
         */
        listRequestedReviewers: {
            (params?: RestEndpointMethodTypes["pulls"]["listRequestedReviewers"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["listRequestedReviewers"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all review comments for a pull request. By default, review comments are in ascending order by ID.
         */
        listReviewComments: {
            (params?: RestEndpointMethodTypes["pulls"]["listReviewComments"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["listReviewComments"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists review comments for all pull requests in a repository. By default, review comments are in ascending order by ID.
         */
        listReviewCommentsForRepo: {
            (params?: RestEndpointMethodTypes["pulls"]["listReviewCommentsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["listReviewCommentsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * The list of reviews returns in chronological order.
         */
        listReviews: {
            (params?: RestEndpointMethodTypes["pulls"]["listReviews"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["listReviews"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Merges a pull request into the base branch.
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         */
        merge: {
            (params?: RestEndpointMethodTypes["pulls"]["merge"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["merge"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes review requests from a pull request for a given set of users and/or teams.
         */
        removeRequestedReviewers: {
            (params?: RestEndpointMethodTypes["pulls"]["removeRequestedReviewers"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["removeRequestedReviewers"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         */
        requestReviewers: {
            (params?: RestEndpointMethodTypes["pulls"]["requestReviewers"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["requestReviewers"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Submits a pending review for a pull request. For more information about creating a pending review for a pull request, see "[Create a review for a pull request](https://docs.github.com/rest/pulls#create-a-review-for-a-pull-request)."
         */
        submitReview: {
            (params?: RestEndpointMethodTypes["pulls"]["submitReview"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["submitReview"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Draft pull requests are available in public repositories with GitHub Free and GitHub Free for organizations, GitHub Pro, and legacy per-repository billing plans, and in public and private repositories with GitHub Team and GitHub Enterprise Cloud. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * To open or update a pull request in a public repository, you must have write access to the head or the source branch. For organization-owned repositories, you must be a member of the organization that owns the repository to open or update a pull request.
         */
        update: {
            (params?: RestEndpointMethodTypes["pulls"]["update"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["update"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates the pull request branch with the latest upstream changes by merging HEAD from the base branch into the pull request branch.
         */
        updateBranch: {
            (params?: RestEndpointMethodTypes["pulls"]["updateBranch"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["updateBranch"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Update the review summary comment with new text.
         */
        updateReview: {
            (params?: RestEndpointMethodTypes["pulls"]["updateReview"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["updateReview"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Enables you to edit a review comment.
         */
        updateReviewComment: {
            (params?: RestEndpointMethodTypes["pulls"]["updateReviewComment"]["parameters"]): Promise<RestEndpointMethodTypes["pulls"]["updateReviewComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    rateLimit: {
        /**
         * **Note:** Accessing this endpoint does not count against your REST API rate limit.
         *
         * **Note:** The `rate` object is deprecated. If you're writing new API client code or updating existing code, you should use the `core` object instead of the `rate` object. The `core` object contains the same information that is present in the `rate` object.
         */
        get: {
            (params?: RestEndpointMethodTypes["rateLimit"]["get"]["parameters"]): Promise<RestEndpointMethodTypes["rateLimit"]["get"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    reactions: {
        /**
         * Create a reaction to a [commit comment](https://docs.github.com/rest/reference/repos#comments). A response with an HTTP `200` status means that you already added the reaction type to this commit comment.
         */
        createForCommitComment: {
            (params?: RestEndpointMethodTypes["reactions"]["createForCommitComment"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["createForCommitComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a reaction to an [issue](https://docs.github.com/rest/reference/issues/). A response with an HTTP `200` status means that you already added the reaction type to this issue.
         */
        createForIssue: {
            (params?: RestEndpointMethodTypes["reactions"]["createForIssue"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["createForIssue"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a reaction to an [issue comment](https://docs.github.com/rest/reference/issues#comments). A response with an HTTP `200` status means that you already added the reaction type to this issue comment.
         */
        createForIssueComment: {
            (params?: RestEndpointMethodTypes["reactions"]["createForIssueComment"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["createForIssueComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a reaction to a [pull request review comment](https://docs.github.com/rest/reference/pulls#comments). A response with an HTTP `200` status means that you already added the reaction type to this pull request review comment.
         */
        createForPullRequestReviewComment: {
            (params?: RestEndpointMethodTypes["reactions"]["createForPullRequestReviewComment"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["createForPullRequestReviewComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a reaction to a [release](https://docs.github.com/rest/reference/repos#releases). A response with a `Status: 200 OK` means that you already added the reaction type to this release.
         */
        createForRelease: {
            (params?: RestEndpointMethodTypes["reactions"]["createForRelease"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["createForRelease"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a reaction to a [team discussion comment](https://docs.github.com/rest/reference/teams#discussion-comments). OAuth access tokens require the `write:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/). A response with an HTTP `200` status means that you already added the reaction type to this team discussion comment.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `POST /organizations/:org_id/team/:team_id/discussions/:discussion_number/comments/:comment_number/reactions`.
         */
        createForTeamDiscussionCommentInOrg: {
            (params?: RestEndpointMethodTypes["reactions"]["createForTeamDiscussionCommentInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["createForTeamDiscussionCommentInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a reaction to a [team discussion](https://docs.github.com/rest/reference/teams#discussions). OAuth access tokens require the `write:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/). A response with an HTTP `200` status means that you already added the reaction type to this team discussion.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `POST /organizations/:org_id/team/:team_id/discussions/:discussion_number/reactions`.
         */
        createForTeamDiscussionInOrg: {
            (params?: RestEndpointMethodTypes["reactions"]["createForTeamDiscussionInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["createForTeamDiscussionInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** You can also specify a repository by `repository_id` using the route `DELETE /repositories/:repository_id/comments/:comment_id/reactions/:reaction_id`.
         *
         * Delete a reaction to a [commit comment](https://docs.github.com/rest/reference/repos#comments).
         */
        deleteForCommitComment: {
            (params?: RestEndpointMethodTypes["reactions"]["deleteForCommitComment"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["deleteForCommitComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** You can also specify a repository by `repository_id` using the route `DELETE /repositories/:repository_id/issues/:issue_number/reactions/:reaction_id`.
         *
         * Delete a reaction to an [issue](https://docs.github.com/rest/reference/issues/).
         */
        deleteForIssue: {
            (params?: RestEndpointMethodTypes["reactions"]["deleteForIssue"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["deleteForIssue"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** You can also specify a repository by `repository_id` using the route `DELETE delete /repositories/:repository_id/issues/comments/:comment_id/reactions/:reaction_id`.
         *
         * Delete a reaction to an [issue comment](https://docs.github.com/rest/reference/issues#comments).
         */
        deleteForIssueComment: {
            (params?: RestEndpointMethodTypes["reactions"]["deleteForIssueComment"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["deleteForIssueComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** You can also specify a repository by `repository_id` using the route `DELETE /repositories/:repository_id/pulls/comments/:comment_id/reactions/:reaction_id.`
         *
         * Delete a reaction to a [pull request review comment](https://docs.github.com/rest/reference/pulls#review-comments).
         */
        deleteForPullRequestComment: {
            (params?: RestEndpointMethodTypes["reactions"]["deleteForPullRequestComment"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["deleteForPullRequestComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** You can also specify a repository by `repository_id` using the route `DELETE delete /repositories/:repository_id/releases/:release_id/reactions/:reaction_id`.
         *
         * Delete a reaction to a [release](https://docs.github.com/rest/reference/repos#releases).
         */
        deleteForRelease: {
            (params?: RestEndpointMethodTypes["reactions"]["deleteForRelease"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["deleteForRelease"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** You can also specify a team or organization with `team_id` and `org_id` using the route `DELETE /organizations/:org_id/team/:team_id/discussions/:discussion_number/reactions/:reaction_id`.
         *
         * Delete a reaction to a [team discussion](https://docs.github.com/rest/reference/teams#discussions). OAuth access tokens require the `write:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         */
        deleteForTeamDiscussion: {
            (params?: RestEndpointMethodTypes["reactions"]["deleteForTeamDiscussion"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["deleteForTeamDiscussion"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** You can also specify a team or organization with `team_id` and `org_id` using the route `DELETE /organizations/:org_id/team/:team_id/discussions/:discussion_number/comments/:comment_number/reactions/:reaction_id`.
         *
         * Delete a reaction to a [team discussion comment](https://docs.github.com/rest/reference/teams#discussion-comments). OAuth access tokens require the `write:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         */
        deleteForTeamDiscussionComment: {
            (params?: RestEndpointMethodTypes["reactions"]["deleteForTeamDiscussionComment"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["deleteForTeamDiscussionComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the reactions to a [commit comment](https://docs.github.com/rest/reference/repos#comments).
         */
        listForCommitComment: {
            (params?: RestEndpointMethodTypes["reactions"]["listForCommitComment"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["listForCommitComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the reactions to an [issue](https://docs.github.com/rest/reference/issues).
         */
        listForIssue: {
            (params?: RestEndpointMethodTypes["reactions"]["listForIssue"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["listForIssue"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the reactions to an [issue comment](https://docs.github.com/rest/reference/issues#comments).
         */
        listForIssueComment: {
            (params?: RestEndpointMethodTypes["reactions"]["listForIssueComment"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["listForIssueComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the reactions to a [pull request review comment](https://docs.github.com/rest/reference/pulls#review-comments).
         */
        listForPullRequestReviewComment: {
            (params?: RestEndpointMethodTypes["reactions"]["listForPullRequestReviewComment"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["listForPullRequestReviewComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the reactions to a [release](https://docs.github.com/rest/reference/repos#releases).
         */
        listForRelease: {
            (params?: RestEndpointMethodTypes["reactions"]["listForRelease"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["listForRelease"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the reactions to a [team discussion comment](https://docs.github.com/rest/reference/teams#discussion-comments/). OAuth access tokens require the `read:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/:org_id/team/:team_id/discussions/:discussion_number/comments/:comment_number/reactions`.
         */
        listForTeamDiscussionCommentInOrg: {
            (params?: RestEndpointMethodTypes["reactions"]["listForTeamDiscussionCommentInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["listForTeamDiscussionCommentInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the reactions to a [team discussion](https://docs.github.com/rest/reference/teams#discussions). OAuth access tokens require the `read:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/:org_id/team/:team_id/discussions/:discussion_number/reactions`.
         */
        listForTeamDiscussionInOrg: {
            (params?: RestEndpointMethodTypes["reactions"]["listForTeamDiscussionInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["reactions"]["listForTeamDiscussionInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    repos: {
        /**
         * @deprecated octokit.rest.repos.acceptInvitation() has been renamed to octokit.rest.repos.acceptInvitationForAuthenticatedUser() (2021-10-05)
         */
        acceptInvitation: {
            (params?: RestEndpointMethodTypes["repos"]["acceptInvitation"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["acceptInvitation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        acceptInvitationForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["repos"]["acceptInvitationForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["acceptInvitationForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Grants the specified apps push access for this branch. Only installed GitHub Apps with `write` access to the `contents` permission can be added as authorized actors on a protected branch.
         */
        addAppAccessRestrictions: {
            (params?: RestEndpointMethodTypes["repos"]["addAppAccessRestrictions"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["addAppAccessRestrictions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         *
         * Adding an outside collaborator may be restricted by enterprise administrators. For more information, see "[Enforcing repository management policies in your enterprise](https://docs.github.com/admin/policies/enforcing-policies-for-your-enterprise/enforcing-repository-management-policies-in-your-enterprise#enforcing-a-policy-for-inviting-outside-collaborators-to-repositories)."
         *
         * For more information on permission levels, see "[Repository permission levels for an organization](https://docs.github.com/github/setting-up-and-managing-organizations-and-teams/repository-permission-levels-for-an-organization#permission-levels-for-repositories-owned-by-an-organization)". There are restrictions on which permissions can be granted to organization members when an organization base role is in place. In this case, the permission being given must be equal to or higher than the org base permission. Otherwise, the request will fail with:
         *
         * ```
         * Cannot assign {member} permission of {role name}
         * ```
         *
         * Note that, if you choose not to pass any parameters, you'll need to set `Content-Length` to zero when calling out to this endpoint. For more information, see "[HTTP verbs](https://docs.github.com/rest/overview/resources-in-the-rest-api#http-verbs)."
         *
         * The invitee will receive a notification that they have been invited to the repository, which they must accept or decline. They may do this via the notifications page, the email they receive, or by using the [repository invitations API endpoints](https://docs.github.com/rest/reference/repos#invitations).
         *
         * **Updating an existing collaborator's permission level**
         *
         * The endpoint can also be used to change the permissions of an existing collaborator without first removing and re-adding the collaborator. To change the permissions, use the same endpoint and pass a different `permission` parameter. The response will be a `204`, with no other indication that the permission level changed.
         *
         * **Rate limits**
         *
         * You are limited to sending 50 invitations to a repository per 24 hour period. Note there is no limit if you are inviting organization members to an organization repository.
         */
        addCollaborator: {
            (params?: RestEndpointMethodTypes["repos"]["addCollaborator"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["addCollaborator"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        addStatusCheckContexts: {
            (params?: RestEndpointMethodTypes["repos"]["addStatusCheckContexts"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["addStatusCheckContexts"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Grants the specified teams push access for this branch. You can also give push access to child teams.
         */
        addTeamAccessRestrictions: {
            (params?: RestEndpointMethodTypes["repos"]["addTeamAccessRestrictions"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["addTeamAccessRestrictions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Grants the specified people push access for this branch.
         *
         * | Type    | Description                                                                                                                   |
         * | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
         * | `array` | Usernames for people who can have push access. **Note**: The list of users, apps, and teams in total is limited to 100 items. |
         */
        addUserAccessRestrictions: {
            (params?: RestEndpointMethodTypes["repos"]["addUserAccessRestrictions"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["addUserAccessRestrictions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * For organization-owned repositories, the list of collaborators includes outside collaborators, organization members that are direct collaborators, organization members with access through team memberships, organization members with access through default organization permissions, and organization owners.
         *
         * Team members will include the members of child teams.
         *
         * You must authenticate using an access token with the `read:org` and `repo` scopes with push access to use this
         * endpoint. GitHub Apps must have the `members` organization permission and `metadata` repository permission to use this
         * endpoint.
         */
        checkCollaborator: {
            (params?: RestEndpointMethodTypes["repos"]["checkCollaborator"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["checkCollaborator"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Shows whether dependency alerts are enabled or disabled for a repository. The authenticated user must have admin read access to the repository. For more information, see "[About security alerts for vulnerable dependencies](https://docs.github.com/articles/about-security-alerts-for-vulnerable-dependencies)".
         */
        checkVulnerabilityAlerts: {
            (params?: RestEndpointMethodTypes["repos"]["checkVulnerabilityAlerts"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["checkVulnerabilityAlerts"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List any syntax errors that are detected in the CODEOWNERS
         * file.
         *
         * For more information about the correct CODEOWNERS syntax,
         * see "[About code owners](https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)."
         */
        codeownersErrors: {
            (params?: RestEndpointMethodTypes["repos"]["codeownersErrors"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["codeownersErrors"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Deprecated**: Use `repos.compareCommitsWithBasehead()` (`GET /repos/{owner}/{repo}/compare/{basehead}`) instead. Both `:base` and `:head` must be branch names in `:repo`. To compare branches across other repositories in the same network as `:repo`, use the format `<USERNAME>:branch`.
         *
         * The response from the API is equivalent to running the `git log base..head` command; however, commits are returned in chronological order. Pass the appropriate [media type](https://docs.github.com/rest/overview/media-types/#commits-commit-comparison-and-pull-requests) to fetch diff and patch formats.
         *
         * The response also includes details on the files that were changed between the two commits. This includes the status of the change (for example, if a file was added, removed, modified, or renamed), and details of the change itself. For example, files with a `renamed` status have a `previous_filename` field showing the previous filename of the file, and files with a `modified` status have a `patch` field showing the changes made to the file.
         *
         * **Working with large comparisons**
         *
         * To process a response with a large number of commits, you can use (`per_page` or `page`) to paginate the results. When using paging, the list of changed files is only returned with page 1, but includes all changed files for the entire comparison. For more information on working with pagination, see "[Traversing with pagination](/rest/guides/traversing-with-pagination)."
         *
         * When calling this API without any paging parameters (`per_page` or `page`), the returned list is limited to 250 commits and the last commit in the list is the most recent of the entire comparison. When a paging parameter is specified, the first commit in the returned list of each page is the earliest.
         *
         * **Signature verification object**
         *
         * The response will include a `verification` object that describes the result of verifying the commit's signature. The following fields are included in the `verification` object:
         *
         * | Name | Type | Description |
         * | ---- | ---- | ----------- |
         * | `verified` | `boolean` | Indicates whether GitHub considers the signature in this commit to be verified. |
         * | `reason` | `string` | The reason for verified value. Possible values and their meanings are enumerated in table below. |
         * | `signature` | `string` | The signature that was extracted from the commit. |
         * | `payload` | `string` | The value that was signed. |
         *
         * These are the possible values for `reason` in the `verification` object:
         *
         * | Value | Description |
         * | ----- | ----------- |
         * | `expired_key` | The key that made the signature is expired. |
         * | `not_signing_key` | The "signing" flag is not among the usage flags in the GPG key that made the signature. |
         * | `gpgverify_error` | There was an error communicating with the signature verification service. |
         * | `gpgverify_unavailable` | The signature verification service is currently unavailable. |
         * | `unsigned` | The object does not include a signature. |
         * | `unknown_signature_type` | A non-PGP signature was found in the commit. |
         * | `no_user` | No user was associated with the `committer` email address in the commit. |
         * | `unverified_email` | The `committer` email address in the commit was associated with a user, but the email address is not verified on her/his account. |
         * | `bad_email` | The `committer` email address in the commit is not included in the identities of the PGP key that made the signature. |
         * | `unknown_key` | The key that made the signature has not been registered with any user's account. |
         * | `malformed_signature` | There was an error parsing the signature. |
         * | `invalid` | The signature could not be cryptographically verified using the key whose key-id was found in the signature. |
         * | `valid` | None of the above errors applied, so the signature is considered to be verified. |
         */
        compareCommits: {
            (params?: RestEndpointMethodTypes["repos"]["compareCommits"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["compareCommits"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Compares two commits against one another. You can compare branches in the same repository, or you can compare branches that exist in different repositories within the same repository network, including fork branches. For more information about how to view a repository's network, see "[Understanding connections between repositories](https://docs.github.com/repositories/viewing-activity-and-data-for-your-repository/understanding-connections-between-repositories)."
         *
         * This endpoint is equivalent to running the `git log BASE..HEAD` command, but it returns commits in a different order. The `git log BASE..HEAD` command returns commits in reverse chronological order, whereas the API returns commits in chronological order. You can pass the appropriate [media type](https://docs.github.com/rest/overview/media-types/#commits-commit-comparison-and-pull-requests) to fetch diff and patch formats.
         *
         * The API response includes details about the files that were changed between the two commits. This includes the status of the change (if a file was added, removed, modified, or renamed), and details of the change itself. For example, files with a `renamed` status have a `previous_filename` field showing the previous filename of the file, and files with a `modified` status have a `patch` field showing the changes made to the file.
         *
         * When calling this endpoint without any paging parameter (`per_page` or `page`), the returned list is limited to 250 commits, and the last commit in the list is the most recent of the entire comparison.
         *
         * **Working with large comparisons**
         *
         * To process a response with a large number of commits, use a query parameter (`per_page` or `page`) to paginate the results. When using pagination:
         *
         * - The list of changed files is only shown on the first page of results, but it includes all changed files for the entire comparison.
         * - The results are returned in chronological order, but the last commit in the returned list may not be the most recent one in the entire set if there are more pages of results.
         *
         * For more information on working with pagination, see "[Using pagination in the REST API](https://docs.github.com/rest/guides/using-pagination-in-the-rest-api)."
         *
         * **Signature verification object**
         *
         * The response will include a `verification` object that describes the result of verifying the commit's signature. The `verification` object includes the following fields:
         *
         * | Name | Type | Description |
         * | ---- | ---- | ----------- |
         * | `verified` | `boolean` | Indicates whether GitHub considers the signature in this commit to be verified. |
         * | `reason` | `string` | The reason for verified value. Possible values and their meanings are enumerated in table below. |
         * | `signature` | `string` | The signature that was extracted from the commit. |
         * | `payload` | `string` | The value that was signed. |
         *
         * These are the possible values for `reason` in the `verification` object:
         *
         * | Value | Description |
         * | ----- | ----------- |
         * | `expired_key` | The key that made the signature is expired. |
         * | `not_signing_key` | The "signing" flag is not among the usage flags in the GPG key that made the signature. |
         * | `gpgverify_error` | There was an error communicating with the signature verification service. |
         * | `gpgverify_unavailable` | The signature verification service is currently unavailable. |
         * | `unsigned` | The object does not include a signature. |
         * | `unknown_signature_type` | A non-PGP signature was found in the commit. |
         * | `no_user` | No user was associated with the `committer` email address in the commit. |
         * | `unverified_email` | The `committer` email address in the commit was associated with a user, but the email address is not verified on their account. |
         * | `bad_email` | The `committer` email address in the commit is not included in the identities of the PGP key that made the signature. |
         * | `unknown_key` | The key that made the signature has not been registered with any user's account. |
         * | `malformed_signature` | There was an error parsing the signature. |
         * | `invalid` | The signature could not be cryptographically verified using the key whose key-id was found in the signature. |
         * | `valid` | None of the above errors applied, so the signature is considered to be verified. |
         */
        compareCommitsWithBasehead: {
            (params?: RestEndpointMethodTypes["repos"]["compareCommitsWithBasehead"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["compareCommitsWithBasehead"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with admin access to the repository can create an autolink.
         */
        createAutolink: {
            (params?: RestEndpointMethodTypes["repos"]["createAutolink"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createAutolink"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a comment for a commit using its `:commit_sha`.
         *
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         */
        createCommitComment: {
            (params?: RestEndpointMethodTypes["repos"]["createCommitComment"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createCommitComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * When authenticated with admin or owner permissions to the repository, you can use this endpoint to require signed commits on a branch. You must enable branch protection to require signed commits.
         */
        createCommitSignatureProtection: {
            (params?: RestEndpointMethodTypes["repos"]["createCommitSignatureProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createCommitSignatureProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with push access in a repository can create commit statuses for a given SHA.
         *
         * Note: there is a limit of 1000 statuses per `sha` and `context` within a repository. Attempts to create more than 1000 statuses will result in a validation error.
         */
        createCommitStatus: {
            (params?: RestEndpointMethodTypes["repos"]["createCommitStatus"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createCommitStatus"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You can create a read-only deploy key.
         */
        createDeployKey: {
            (params?: RestEndpointMethodTypes["repos"]["createDeployKey"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createDeployKey"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deployments offer a few configurable parameters with certain defaults.
         *
         * The `ref` parameter can be any named branch, tag, or SHA. At GitHub we often deploy branches and verify them
         * before we merge a pull request.
         *
         * The `environment` parameter allows deployments to be issued to different runtime environments. Teams often have
         * multiple environments for verifying their applications, such as `production`, `staging`, and `qa`. This parameter
         * makes it easier to track which environments have requested deployments. The default environment is `production`.
         *
         * The `auto_merge` parameter is used to ensure that the requested ref is not behind the repository's default branch. If
         * the ref _is_ behind the default branch for the repository, we will attempt to merge it for you. If the merge succeeds,
         * the API will return a successful merge commit. If merge conflicts prevent the merge from succeeding, the API will
         * return a failure response.
         *
         * By default, [commit statuses](https://docs.github.com/rest/commits/statuses) for every submitted context must be in a `success`
         * state. The `required_contexts` parameter allows you to specify a subset of contexts that must be `success`, or to
         * specify contexts that have not yet been submitted. You are not required to use commit statuses to deploy. If you do
         * not require any contexts or create any commit statuses, the deployment will always succeed.
         *
         * The `payload` parameter is available for any extra information that a deployment system might need. It is a JSON text
         * field that will be passed on when a deployment event is dispatched.
         *
         * The `task` parameter is used by the deployment system to allow different execution paths. In the web world this might
         * be `deploy:migrations` to run schema changes on the system. In the compiled world this could be a flag to compile an
         * application with debugging enabled.
         *
         * Users with `repo` or `repo_deployment` scopes can create a deployment for a given ref.
         *
         * #### Merged branch response
         * You will see this response when GitHub automatically merges the base branch into the topic branch instead of creating
         * a deployment. This auto-merge happens when:
         * *   Auto-merge option is enabled in the repository
         * *   Topic branch does not include the latest changes on the base branch, which is `master` in the response example
         * *   There are no merge conflicts
         *
         * If there are no new commits in the base branch, a new request to create a deployment should give a successful
         * response.
         *
         * #### Merge conflict response
         * This error happens when the `auto_merge` option is enabled and when the default branch (in this case `master`), can't
         * be merged into the branch that's being deployed (in this case `topic-branch`), due to merge conflicts.
         *
         * #### Failed commit status checks
         * This error happens when the `required_contexts` parameter indicates that one or more contexts need to have a `success`
         * status for the commit to be deployed, but one or more of the required contexts do not have a state of `success`.
         */
        createDeployment: {
            (params?: RestEndpointMethodTypes["repos"]["createDeployment"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createDeployment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a deployment branch policy for an environment.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `administration:write` permission for the repository to use this endpoint.
         */
        createDeploymentBranchPolicy: {
            (params?: RestEndpointMethodTypes["repos"]["createDeploymentBranchPolicy"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createDeploymentBranchPolicy"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Enable a custom deployment protection rule for an environment.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. Enabling a custom protection rule requires admin or owner permissions to the repository. GitHub Apps must have the `actions:write` permission to use this endpoint.
         *
         * For more information about the app that is providing this custom deployment rule, see the [documentation for the `GET /apps/{app_slug}` endpoint](https://docs.github.com/rest/apps/apps#get-an-app).
         */
        createDeploymentProtectionRule: {
            (params?: RestEndpointMethodTypes["repos"]["createDeploymentProtectionRule"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createDeploymentProtectionRule"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with `push` access can create deployment statuses for a given deployment.
         *
         * GitHub Apps require `read & write` access to "Deployments" and `read-only` access to "Repo contents" (for private repos). OAuth Apps require the `repo_deployment` scope.
         */
        createDeploymentStatus: {
            (params?: RestEndpointMethodTypes["repos"]["createDeploymentStatus"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createDeploymentStatus"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You can use this endpoint to trigger a webhook event called `repository_dispatch` when you want activity that happens outside of GitHub to trigger a GitHub Actions workflow or GitHub App webhook. You must configure your GitHub Actions workflow or GitHub App to run when the `repository_dispatch` event occurs. For an example `repository_dispatch` webhook payload, see "[RepositoryDispatchEvent](https://docs.github.com/webhooks/event-payloads/#repository_dispatch)."
         *
         * The `client_payload` parameter is available for any extra information that your workflow might need. This parameter is a JSON payload that will be passed on when the webhook event is dispatched. For example, the `client_payload` can include a message that a user would like to send using a GitHub Actions workflow. Or the `client_payload` can be used as a test to debug your workflow.
         *
         * This endpoint requires write access to the repository by providing either:
         *
         *   - Personal access tokens with `repo` scope. For more information, see "[Creating a personal access token for the command line](https://docs.github.com/articles/creating-a-personal-access-token-for-the-command-line)" in the GitHub Help documentation.
         *   - GitHub Apps with both `metadata:read` and `contents:read&write` permissions.
         *
         * This input example shows how you can use the `client_payload` as a test to debug your workflow.
         */
        createDispatchEvent: {
            (params?: RestEndpointMethodTypes["repos"]["createDispatchEvent"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createDispatchEvent"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a new repository for the authenticated user.
         *
         * **OAuth scope requirements**
         *
         * When using [OAuth](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/), authorizations must include:
         *
         * *   `public_repo` scope or `repo` scope to create a public repository. Note: For GitHub AE, use `repo` scope to create an internal repository.
         * *   `repo` scope to create a private repository.
         */
        createForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["repos"]["createForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a fork for the authenticated user.
         *
         * **Note**: Forking a Repository happens asynchronously. You may have to wait a short period of time before you can access the git objects. If this takes longer than 5 minutes, be sure to contact [GitHub Support](https://support.github.com/contact?tags=dotcom-rest-api).
         *
         * **Note**: Although this endpoint works with GitHub Apps, the GitHub App must be installed on the destination account with access to all repositories and on the source account with access to the source repository.
         */
        createFork: {
            (params?: RestEndpointMethodTypes["repos"]["createFork"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createFork"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a new repository in the specified organization. The authenticated user must be a member of the organization.
         *
         * **OAuth scope requirements**
         *
         * When using [OAuth](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/), authorizations must include:
         *
         * *   `public_repo` scope or `repo` scope to create a public repository. Note: For GitHub AE, use `repo` scope to create an internal repository.
         * *   `repo` scope to create a private repository
         */
        createInOrg: {
            (params?: RestEndpointMethodTypes["repos"]["createInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create or update an environment with protection rules, such as required reviewers. For more information about environment protection rules, see "[Environments](/actions/reference/environments#environment-protection-rules)."
         *
         * **Note:** To create or update name patterns that branches must match in order to deploy to this environment, see "[Deployment branch policies](/rest/deployments/branch-policies)."
         *
         * **Note:** To create or update secrets for an environment, see "[Secrets](/rest/reference/actions#secrets)."
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `administration:write` permission for the repository to use this endpoint.
         */
        createOrUpdateEnvironment: {
            (params?: RestEndpointMethodTypes["repos"]["createOrUpdateEnvironment"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createOrUpdateEnvironment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a new file or replaces an existing file in a repository. You must authenticate using an access token with the `workflow` scope to use this endpoint.
         *
         * **Note:** If you use this endpoint and the "[Delete a file](https://docs.github.com/rest/reference/repos/#delete-file)" endpoint in parallel, the concurrent requests will conflict and you will receive errors. You must use these endpoints serially instead.
         */
        createOrUpdateFileContents: {
            (params?: RestEndpointMethodTypes["repos"]["createOrUpdateFileContents"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createOrUpdateFileContents"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a repository ruleset for an organization.
         */
        createOrgRuleset: {
            (params?: RestEndpointMethodTypes["repos"]["createOrgRuleset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createOrgRuleset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a GitHub Pages deployment for a repository.
         *
         * Users must have write permissions. GitHub Apps must have the `pages:write` permission to use this endpoint.
         */
        createPagesDeployment: {
            (params?: RestEndpointMethodTypes["repos"]["createPagesDeployment"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createPagesDeployment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Configures a GitHub Pages site. For more information, see "[About GitHub Pages](/github/working-with-github-pages/about-github-pages)."
         *
         * To use this endpoint, you must be a repository administrator, maintainer, or have the 'manage GitHub Pages settings' permission. A token with the `repo` scope or Pages write permission is required. GitHub Apps must have the `administration:write` and `pages:write` permissions.
         */
        createPagesSite: {
            (params?: RestEndpointMethodTypes["repos"]["createPagesSite"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createPagesSite"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with push access to the repository can create a release.
         *
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         */
        createRelease: {
            (params?: RestEndpointMethodTypes["repos"]["createRelease"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createRelease"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Create a ruleset for a repository.
         */
        createRepoRuleset: {
            (params?: RestEndpointMethodTypes["repos"]["createRepoRuleset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createRepoRuleset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This creates a tag protection state for a repository.
         * This endpoint is only available to repository administrators.
         */
        createTagProtection: {
            (params?: RestEndpointMethodTypes["repos"]["createTagProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createTagProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a new repository using a repository template. Use the `template_owner` and `template_repo` route parameters to specify the repository to use as the template. If the repository is not public, the authenticated user must own or be a member of an organization that owns the repository. To check if a repository is available to use as a template, get the repository's information using the [Get a repository](https://docs.github.com/rest/reference/repos#get-a-repository) endpoint and check that the `is_template` key is `true`.
         *
         * **OAuth scope requirements**
         *
         * When using [OAuth](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/), authorizations must include:
         *
         * *   `public_repo` scope or `repo` scope to create a public repository. Note: For GitHub AE, use `repo` scope to create an internal repository.
         * *   `repo` scope to create a private repository
         */
        createUsingTemplate: {
            (params?: RestEndpointMethodTypes["repos"]["createUsingTemplate"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createUsingTemplate"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Repositories can have multiple webhooks installed. Each webhook should have a unique `config`. Multiple webhooks can
         * share the same `config` as long as those webhooks do not have any `events` that overlap.
         */
        createWebhook: {
            (params?: RestEndpointMethodTypes["repos"]["createWebhook"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["createWebhook"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * @deprecated octokit.rest.repos.declineInvitation() has been renamed to octokit.rest.repos.declineInvitationForAuthenticatedUser() (2021-10-05)
         */
        declineInvitation: {
            (params?: RestEndpointMethodTypes["repos"]["declineInvitation"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["declineInvitation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        declineInvitationForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["repos"]["declineInvitationForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["declineInvitationForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deleting a repository requires admin access. If OAuth is used, the `delete_repo` scope is required.
         *
         * If an organization owner has configured the organization to prevent members from deleting organization-owned
         * repositories, you will get a `403 Forbidden` response.
         */
        delete: {
            (params?: RestEndpointMethodTypes["repos"]["delete"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["delete"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Disables the ability to restrict who can push to this branch.
         */
        deleteAccessRestrictions: {
            (params?: RestEndpointMethodTypes["repos"]["deleteAccessRestrictions"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteAccessRestrictions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Removing admin enforcement requires admin or owner permissions to the repository and branch protection to be enabled.
         */
        deleteAdminBranchProtection: {
            (params?: RestEndpointMethodTypes["repos"]["deleteAdminBranchProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteAdminBranchProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You must authenticate using an access token with the repo scope to use this endpoint.
         */
        deleteAnEnvironment: {
            (params?: RestEndpointMethodTypes["repos"]["deleteAnEnvironment"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteAnEnvironment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This deletes a single autolink reference by ID that was configured for the given repository.
         *
         * Information about autolinks are only available to repository administrators.
         */
        deleteAutolink: {
            (params?: RestEndpointMethodTypes["repos"]["deleteAutolink"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteAutolink"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        deleteBranchProtection: {
            (params?: RestEndpointMethodTypes["repos"]["deleteBranchProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteBranchProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        deleteCommitComment: {
            (params?: RestEndpointMethodTypes["repos"]["deleteCommitComment"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteCommitComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * When authenticated with admin or owner permissions to the repository, you can use this endpoint to disable required signed commits on a branch. You must enable branch protection to require signed commits.
         */
        deleteCommitSignatureProtection: {
            (params?: RestEndpointMethodTypes["repos"]["deleteCommitSignatureProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteCommitSignatureProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deploy keys are immutable. If you need to update a key, remove the key and create a new one instead.
         */
        deleteDeployKey: {
            (params?: RestEndpointMethodTypes["repos"]["deleteDeployKey"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteDeployKey"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * If the repository only has one deployment, you can delete the deployment regardless of its status. If the repository has more than one deployment, you can only delete inactive deployments. This ensures that repositories with multiple deployments will always have an active deployment. Anyone with `repo` or `repo_deployment` scopes can delete a deployment.
         *
         * To set a deployment as inactive, you must:
         *
         * *   Create a new deployment that is active so that the system has a record of the current state, then delete the previously active deployment.
         * *   Mark the active deployment as inactive by adding any non-successful deployment status.
         *
         * For more information, see "[Create a deployment](https://docs.github.com/rest/deployments/deployments/#create-a-deployment)" and "[Create a deployment status](https://docs.github.com/rest/deployments/deployment-statuses#create-a-deployment-status)."
         */
        deleteDeployment: {
            (params?: RestEndpointMethodTypes["repos"]["deleteDeployment"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteDeployment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a deployment branch policy for an environment.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `administration:write` permission for the repository to use this endpoint.
         */
        deleteDeploymentBranchPolicy: {
            (params?: RestEndpointMethodTypes["repos"]["deleteDeploymentBranchPolicy"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteDeploymentBranchPolicy"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a file in a repository.
         *
         * You can provide an additional `committer` parameter, which is an object containing information about the committer. Or, you can provide an `author` parameter, which is an object containing information about the author.
         *
         * The `author` section is optional and is filled in with the `committer` information if omitted. If the `committer` information is omitted, the authenticated user's information is used.
         *
         * You must provide values for both `name` and `email`, whether you choose to use `author` or `committer`. Otherwise, you'll receive a `422` status code.
         *
         * **Note:** If you use this endpoint and the "[Create or update file contents](https://docs.github.com/rest/reference/repos/#create-or-update-file-contents)" endpoint in parallel, the concurrent requests will conflict and you will receive errors. You must use these endpoints serially instead.
         */
        deleteFile: {
            (params?: RestEndpointMethodTypes["repos"]["deleteFile"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteFile"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        deleteInvitation: {
            (params?: RestEndpointMethodTypes["repos"]["deleteInvitation"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteInvitation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Delete a ruleset for an organization.
         */
        deleteOrgRuleset: {
            (params?: RestEndpointMethodTypes["repos"]["deleteOrgRuleset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteOrgRuleset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a GitHub Pages site. For more information, see "[About GitHub Pages](/github/working-with-github-pages/about-github-pages).
         *
         * To use this endpoint, you must be a repository administrator, maintainer, or have the 'manage GitHub Pages settings' permission. A token with the `repo` scope or Pages write permission is required. GitHub Apps must have the `administration:write` and `pages:write` permissions.
         */
        deletePagesSite: {
            (params?: RestEndpointMethodTypes["repos"]["deletePagesSite"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deletePagesSite"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        deletePullRequestReviewProtection: {
            (params?: RestEndpointMethodTypes["repos"]["deletePullRequestReviewProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deletePullRequestReviewProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with push access to the repository can delete a release.
         */
        deleteRelease: {
            (params?: RestEndpointMethodTypes["repos"]["deleteRelease"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteRelease"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        deleteReleaseAsset: {
            (params?: RestEndpointMethodTypes["repos"]["deleteReleaseAsset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteReleaseAsset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Delete a ruleset for a repository.
         */
        deleteRepoRuleset: {
            (params?: RestEndpointMethodTypes["repos"]["deleteRepoRuleset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteRepoRuleset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This deletes a tag protection state for a repository.
         * This endpoint is only available to repository administrators.
         */
        deleteTagProtection: {
            (params?: RestEndpointMethodTypes["repos"]["deleteTagProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteTagProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        deleteWebhook: {
            (params?: RestEndpointMethodTypes["repos"]["deleteWebhook"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["deleteWebhook"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Disables automated security fixes for a repository. The authenticated user must have admin access to the repository. For more information, see "[Configuring automated security fixes](https://docs.github.com/articles/configuring-automated-security-fixes)".
         */
        disableAutomatedSecurityFixes: {
            (params?: RestEndpointMethodTypes["repos"]["disableAutomatedSecurityFixes"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["disableAutomatedSecurityFixes"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Disables a custom deployment protection rule for an environment.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. Removing a custom protection rule requires admin or owner permissions to the repository. GitHub Apps must have the `actions:write` permission to use this endpoint. For more information, see "[Get an app](https://docs.github.com/rest/apps/apps#get-an-app)".
         */
        disableDeploymentProtectionRule: {
            (params?: RestEndpointMethodTypes["repos"]["disableDeploymentProtectionRule"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["disableDeploymentProtectionRule"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Disables Git LFS for a repository. Access tokens must have the `admin:enterprise` scope.
         */
        disableLfsForRepo: {
            (params?: RestEndpointMethodTypes["repos"]["disableLfsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["disableLfsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Disables dependency alerts and the dependency graph for a repository.
         * The authenticated user must have admin access to the repository. For more information,
         * see "[About security alerts for vulnerable dependencies](https://docs.github.com/articles/about-security-alerts-for-vulnerable-dependencies)".
         */
        disableVulnerabilityAlerts: {
            (params?: RestEndpointMethodTypes["repos"]["disableVulnerabilityAlerts"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["disableVulnerabilityAlerts"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a redirect URL to download a zip archive for a repository. If you omit `:ref`, the repository’s default branch (usually
         * `main`) will be used. Please make sure your HTTP framework is configured to follow redirects or you will need to use
         * the `Location` header to make a second `GET` request.
         *
         * **Note**: For private repositories, these links are temporary and expire after five minutes. If the repository is empty, you will receive a 404 when you follow the redirect.
         * @deprecated octokit.rest.repos.downloadArchive() has been renamed to octokit.rest.repos.downloadZipballArchive() (2020-09-17)
         */
        downloadArchive: {
            (params?: RestEndpointMethodTypes["repos"]["downloadArchive"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["downloadArchive"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a redirect URL to download a tar archive for a repository. If you omit `:ref`, the repository’s default branch (usually
         * `main`) will be used. Please make sure your HTTP framework is configured to follow redirects or you will need to use
         * the `Location` header to make a second `GET` request.
         * **Note**: For private repositories, these links are temporary and expire after five minutes.
         */
        downloadTarballArchive: {
            (params?: RestEndpointMethodTypes["repos"]["downloadTarballArchive"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["downloadTarballArchive"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a redirect URL to download a zip archive for a repository. If you omit `:ref`, the repository’s default branch (usually
         * `main`) will be used. Please make sure your HTTP framework is configured to follow redirects or you will need to use
         * the `Location` header to make a second `GET` request.
         *
         * **Note**: For private repositories, these links are temporary and expire after five minutes. If the repository is empty, you will receive a 404 when you follow the redirect.
         */
        downloadZipballArchive: {
            (params?: RestEndpointMethodTypes["repos"]["downloadZipballArchive"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["downloadZipballArchive"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Enables automated security fixes for a repository. The authenticated user must have admin access to the repository. For more information, see "[Configuring automated security fixes](https://docs.github.com/articles/configuring-automated-security-fixes)".
         */
        enableAutomatedSecurityFixes: {
            (params?: RestEndpointMethodTypes["repos"]["enableAutomatedSecurityFixes"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["enableAutomatedSecurityFixes"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Enables Git LFS for a repository. Access tokens must have the `admin:enterprise` scope.
         */
        enableLfsForRepo: {
            (params?: RestEndpointMethodTypes["repos"]["enableLfsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["enableLfsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Enables dependency alerts and the dependency graph for a repository. The authenticated user must have admin access to the repository. For more information, see "[About security alerts for vulnerable dependencies](https://docs.github.com/articles/about-security-alerts-for-vulnerable-dependencies)".
         */
        enableVulnerabilityAlerts: {
            (params?: RestEndpointMethodTypes["repos"]["enableVulnerabilityAlerts"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["enableVulnerabilityAlerts"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Generate a name and body describing a [release](https://docs.github.com/rest/reference/repos#releases). The body content will be markdown formatted and contain information like the changes since last release and users who contributed. The generated release notes are not saved anywhere. They are intended to be generated and used when creating a new release.
         */
        generateReleaseNotes: {
            (params?: RestEndpointMethodTypes["repos"]["generateReleaseNotes"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["generateReleaseNotes"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * The `parent` and `source` objects are present when the repository is a fork. `parent` is the repository this repository was forked from, `source` is the ultimate source for the network.
         *
         * **Note:** In order to see the `security_and_analysis` block for a repository you must have admin permissions for the repository or be an owner or security manager for the organization that owns the repository. For more information, see "[Managing security managers in your organization](https://docs.github.com/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization)."
         */
        get: {
            (params?: RestEndpointMethodTypes["repos"]["get"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["get"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Lists who has access to this protected branch.
         *
         * **Note**: Users, apps, and teams `restrictions` are only available for organization-owned repositories.
         */
        getAccessRestrictions: {
            (params?: RestEndpointMethodTypes["repos"]["getAccessRestrictions"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getAccessRestrictions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        getAdminBranchProtection: {
            (params?: RestEndpointMethodTypes["repos"]["getAdminBranchProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getAdminBranchProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets all custom deployment protection rules that are enabled for an environment. Anyone with read access to the repository can use this endpoint. If the repository is private and you want to use a personal access token (classic), you must use an access token with the `repo` scope. GitHub Apps and fine-grained personal access tokens must have the `actions:read` permission to use this endpoint. For more information about environments, see "[Using environments for deployment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)."
         *
         * For more information about the app that is providing this custom deployment rule, see the [documentation for the `GET /apps/{app_slug}` endpoint](https://docs.github.com/rest/apps/apps#get-an-app).
         */
        getAllDeploymentProtectionRules: {
            (params?: RestEndpointMethodTypes["repos"]["getAllDeploymentProtectionRules"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getAllDeploymentProtectionRules"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the environments for a repository.
         *
         * Anyone with read access to the repository can use this endpoint. If the repository is private, you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getAllEnvironments: {
            (params?: RestEndpointMethodTypes["repos"]["getAllEnvironments"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getAllEnvironments"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        getAllStatusCheckContexts: {
            (params?: RestEndpointMethodTypes["repos"]["getAllStatusCheckContexts"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getAllStatusCheckContexts"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        getAllTopics: {
            (params?: RestEndpointMethodTypes["repos"]["getAllTopics"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getAllTopics"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Lists the GitHub Apps that have push access to this branch. Only installed GitHub Apps with `write` access to the `contents` permission can be added as authorized actors on a protected branch.
         */
        getAppsWithAccessToProtectedBranch: {
            (params?: RestEndpointMethodTypes["repos"]["getAppsWithAccessToProtectedBranch"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getAppsWithAccessToProtectedBranch"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This returns a single autolink reference by ID that was configured for the given repository.
         *
         * Information about autolinks are only available to repository administrators.
         */
        getAutolink: {
            (params?: RestEndpointMethodTypes["repos"]["getAutolink"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getAutolink"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        getBranch: {
            (params?: RestEndpointMethodTypes["repos"]["getBranch"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getBranch"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        getBranchProtection: {
            (params?: RestEndpointMethodTypes["repos"]["getBranchProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getBranchProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns all rules that apply to the specified branch.
         */
        getBranchRules: {
            (params?: RestEndpointMethodTypes["repos"]["getBranchRules"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getBranchRules"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get the total number of clones and breakdown per day or week for the last 14 days. Timestamps are aligned to UTC midnight of the beginning of the day or week. Week begins on Monday.
         */
        getClones: {
            (params?: RestEndpointMethodTypes["repos"]["getClones"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getClones"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a weekly aggregate of the number of additions and deletions pushed to a repository.
         */
        getCodeFrequencyStats: {
            (params?: RestEndpointMethodTypes["repos"]["getCodeFrequencyStats"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getCodeFrequencyStats"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Checks the repository permission of a collaborator. The possible repository permissions are `admin`, `write`, `read`, and `none`.
         */
        getCollaboratorPermissionLevel: {
            (params?: RestEndpointMethodTypes["repos"]["getCollaboratorPermissionLevel"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getCollaboratorPermissionLevel"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with pull access in a repository can access a combined view of commit statuses for a given ref. The ref can be a SHA, a branch name, or a tag name.
         *
         *
         * Additionally, a combined `state` is returned. The `state` is one of:
         *
         * *   **failure** if any of the contexts report as `error` or `failure`
         * *   **pending** if there are no statuses or a context is `pending`
         * *   **success** if the latest status for all contexts is `success`
         */
        getCombinedStatusForRef: {
            (params?: RestEndpointMethodTypes["repos"]["getCombinedStatusForRef"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getCombinedStatusForRef"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns the contents of a single commit reference. You must have `read` access for the repository to use this endpoint.
         *
         * **Note:** If there are more than 300 files in the commit diff, the response will include pagination link headers for the remaining files, up to a limit of 3000 files. Each page contains the static commit information, and the only changes are to the file listing.
         *
         * You can pass the appropriate [media type](https://docs.github.com/rest/overview/media-types/#commits-commit-comparison-and-pull-requests) to  fetch `diff` and `patch` formats. Diffs with binary data will have no `patch` property.
         *
         * To return only the SHA-1 hash of the commit reference, you can provide the `sha` custom [media type](https://docs.github.com/rest/overview/media-types/#commits-commit-comparison-and-pull-requests) in the `Accept` header. You can use this endpoint to check if a remote reference's SHA-1 hash is the same as your local reference's SHA-1 hash by providing the local SHA-1 reference as the ETag.
         *
         * **Signature verification object**
         *
         * The response will include a `verification` object that describes the result of verifying the commit's signature. The following fields are included in the `verification` object:
         *
         * | Name | Type | Description |
         * | ---- | ---- | ----------- |
         * | `verified` | `boolean` | Indicates whether GitHub considers the signature in this commit to be verified. |
         * | `reason` | `string` | The reason for verified value. Possible values and their meanings are enumerated in table below. |
         * | `signature` | `string` | The signature that was extracted from the commit. |
         * | `payload` | `string` | The value that was signed. |
         *
         * These are the possible values for `reason` in the `verification` object:
         *
         * | Value | Description |
         * | ----- | ----------- |
         * | `expired_key` | The key that made the signature is expired. |
         * | `not_signing_key` | The "signing" flag is not among the usage flags in the GPG key that made the signature. |
         * | `gpgverify_error` | There was an error communicating with the signature verification service. |
         * | `gpgverify_unavailable` | The signature verification service is currently unavailable. |
         * | `unsigned` | The object does not include a signature. |
         * | `unknown_signature_type` | A non-PGP signature was found in the commit. |
         * | `no_user` | No user was associated with the `committer` email address in the commit. |
         * | `unverified_email` | The `committer` email address in the commit was associated with a user, but the email address is not verified on their account. |
         * | `bad_email` | The `committer` email address in the commit is not included in the identities of the PGP key that made the signature. |
         * | `unknown_key` | The key that made the signature has not been registered with any user's account. |
         * | `malformed_signature` | There was an error parsing the signature. |
         * | `invalid` | The signature could not be cryptographically verified using the key whose key-id was found in the signature. |
         * | `valid` | None of the above errors applied, so the signature is considered to be verified. |
         */
        getCommit: {
            (params?: RestEndpointMethodTypes["repos"]["getCommit"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getCommit"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns the last year of commit activity grouped by week. The `days` array is a group of commits per day, starting on `Sunday`.
         */
        getCommitActivityStats: {
            (params?: RestEndpointMethodTypes["repos"]["getCommitActivityStats"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getCommitActivityStats"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        getCommitComment: {
            (params?: RestEndpointMethodTypes["repos"]["getCommitComment"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getCommitComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * When authenticated with admin or owner permissions to the repository, you can use this endpoint to check whether a branch requires signed commits. An enabled status of `true` indicates you must sign commits on this branch. For more information, see [Signing commits with GPG](https://docs.github.com/articles/signing-commits-with-gpg) in GitHub Help.
         *
         * **Note**: You must enable branch protection to require signed commits.
         */
        getCommitSignatureProtection: {
            (params?: RestEndpointMethodTypes["repos"]["getCommitSignatureProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getCommitSignatureProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns all community profile metrics for a repository. The repository cannot be a fork.
         *
         * The returned metrics include an overall health score, the repository description, the presence of documentation, the
         * detected code of conduct, the detected license, and the presence of ISSUE\_TEMPLATE, PULL\_REQUEST\_TEMPLATE,
         * README, and CONTRIBUTING files.
         *
         * The `health_percentage` score is defined as a percentage of how many of
         * these four documents are present: README, CONTRIBUTING, LICENSE, and
         * CODE_OF_CONDUCT. For example, if all four documents are present, then
         * the `health_percentage` is `100`. If only one is present, then the
         * `health_percentage` is `25`.
         *
         * `content_reports_enabled` is only returned for organization-owned repositories.
         */
        getCommunityProfileMetrics: {
            (params?: RestEndpointMethodTypes["repos"]["getCommunityProfileMetrics"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getCommunityProfileMetrics"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the contents of a file or directory in a repository. Specify the file path or directory in `:path`. If you omit
         * `:path`, you will receive the contents of the repository's root directory. See the description below regarding what the API response includes for directories.
         *
         * Files and symlinks support [a custom media type](https://docs.github.com/rest/reference/repos#custom-media-types) for
         * retrieving the raw content or rendered HTML (when supported). All content types support [a custom media
         * type](https://docs.github.com/rest/reference/repos#custom-media-types) to ensure the content is returned in a consistent
         * object format.
         *
         * **Notes**:
         * *   To get a repository's contents recursively, you can [recursively get the tree](https://docs.github.com/rest/reference/git#trees).
         * *   This API has an upper limit of 1,000 files for a directory. If you need to retrieve more files, use the [Git Trees
         * API](https://docs.github.com/rest/reference/git#get-a-tree).
         *  *  Download URLs expire and are meant to be used just once. To ensure the download URL does not expire, please use the contents API to obtain a fresh download URL for each download.
         * #### Size limits
         * If the requested file's size is:
         * * 1 MB or smaller: All features of this endpoint are supported.
         * * Between 1-100 MB: Only the `raw` or `object` [custom media types](https://docs.github.com/rest/repos/contents#custom-media-types-for-repository-contents) are supported. Both will work as normal, except that when using the `object` media type, the `content` field will be an empty string and the `encoding` field will be `"none"`. To get the contents of these larger files, use the `raw` media type.
         *  * Greater than 100 MB: This endpoint is not supported.
         *
         * #### If the content is a directory
         * The response will be an array of objects, one object for each item in the directory.
         * When listing the contents of a directory, submodules have their "type" specified as "file". Logically, the value
         * _should_ be "submodule". This behavior exists in API v3 [for backwards compatibility purposes](https://git.io/v1YCW).
         * In the next major version of the API, the type will be returned as "submodule".
         *
         * #### If the content is a symlink
         * If the requested `:path` points to a symlink, and the symlink's target is a normal file in the repository, then the
         * API responds with the content of the file (in the format shown in the example. Otherwise, the API responds with an object
         * describing the symlink itself.
         *
         * #### If the content is a submodule
         * The `submodule_git_url` identifies the location of the submodule repository, and the `sha` identifies a specific
         * commit within the submodule repository. Git uses the given URL when cloning the submodule repository, and checks out
         * the submodule at that specific commit.
         *
         * If the submodule repository is not hosted on github.com, the Git URLs (`git_url` and `_links["git"]`) and the
         * github.com URLs (`html_url` and `_links["html"]`) will have null values.
         */
        getContent: {
            (params?: RestEndpointMethodTypes["repos"]["getContent"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getContent"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns the `total` number of commits authored by the contributor. In addition, the response includes a Weekly Hash (`weeks` array) with the following information:
         *
         * *   `w` - Start of the week, given as a [Unix timestamp](http://en.wikipedia.org/wiki/Unix_time).
         * *   `a` - Number of additions
         * *   `d` - Number of deletions
         * *   `c` - Number of commits
         */
        getContributorsStats: {
            (params?: RestEndpointMethodTypes["repos"]["getContributorsStats"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getContributorsStats"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets an enabled custom deployment protection rule for an environment. Anyone with read access to the repository can use this endpoint. If the repository is private and you want to use a personal access token (classic), you must use an access token with the `repo` scope. GitHub Apps and fine-grained personal access tokens must have the `actions:read` permission to use this endpoint. For more information about environments, see "[Using environments for deployment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)."
         *
         * For more information about the app that is providing this custom deployment rule, see [`GET /apps/{app_slug}`](https://docs.github.com/rest/apps/apps#get-an-app).
         */
        getCustomDeploymentProtectionRule: {
            (params?: RestEndpointMethodTypes["repos"]["getCustomDeploymentProtectionRule"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getCustomDeploymentProtectionRule"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        getDeployKey: {
            (params?: RestEndpointMethodTypes["repos"]["getDeployKey"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getDeployKey"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        getDeployment: {
            (params?: RestEndpointMethodTypes["repos"]["getDeployment"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getDeployment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a deployment branch policy for an environment.
         *
         * Anyone with read access to the repository can use this endpoint. If the repository is private, you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        getDeploymentBranchPolicy: {
            (params?: RestEndpointMethodTypes["repos"]["getDeploymentBranchPolicy"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getDeploymentBranchPolicy"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with pull access can view a deployment status for a deployment:
         */
        getDeploymentStatus: {
            (params?: RestEndpointMethodTypes["repos"]["getDeploymentStatus"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getDeploymentStatus"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** To get information about name patterns that branches must match in order to deploy to this environment, see "[Get a deployment branch policy](/rest/deployments/branch-policies#get-a-deployment-branch-policy)."
         *
         * Anyone with read access to the repository can use this endpoint. If the
         * repository is private, you must use an access token with the `repo` scope. GitHub
         * Apps must have the `actions:read` permission to use this endpoint.
         */
        getEnvironment: {
            (params?: RestEndpointMethodTypes["repos"]["getEnvironment"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getEnvironment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets information about the single most recent build of a GitHub Pages site.
         *
         * A token with the `repo` scope is required. GitHub Apps must have the `pages:read` permission.
         */
        getLatestPagesBuild: {
            (params?: RestEndpointMethodTypes["repos"]["getLatestPagesBuild"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getLatestPagesBuild"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * View the latest published full release for the repository.
         *
         * The latest release is the most recent non-prerelease, non-draft release, sorted by the `created_at` attribute. The `created_at` attribute is the date of the commit used for the release, and not the date when the release was drafted or published.
         */
        getLatestRelease: {
            (params?: RestEndpointMethodTypes["repos"]["getLatestRelease"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getLatestRelease"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get a repository ruleset for an organization.
         */
        getOrgRuleset: {
            (params?: RestEndpointMethodTypes["repos"]["getOrgRuleset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getOrgRuleset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get all the repository rulesets for an organization.
         */
        getOrgRulesets: {
            (params?: RestEndpointMethodTypes["repos"]["getOrgRulesets"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getOrgRulesets"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets information about a GitHub Pages site.
         *
         * A token with the `repo` scope is required. GitHub Apps must have the `pages:read` permission.
         */
        getPages: {
            (params?: RestEndpointMethodTypes["repos"]["getPages"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getPages"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets information about a GitHub Pages build.
         *
         * A token with the `repo` scope is required. GitHub Apps must have the `pages:read` permission.
         */
        getPagesBuild: {
            (params?: RestEndpointMethodTypes["repos"]["getPagesBuild"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getPagesBuild"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a health check of the DNS settings for the `CNAME` record configured for a repository's GitHub Pages.
         *
         * The first request to this endpoint returns a `202 Accepted` status and starts an asynchronous background task to get the results for the domain. After the background task completes, subsequent requests to this endpoint return a `200 OK` status with the health check results in the response.
         *
         * To use this endpoint, you must be a repository administrator, maintainer, or have the 'manage GitHub Pages settings' permission. A token with the `repo` scope or Pages write permission is required. GitHub Apps must have the `administrative:write` and `pages:write` permissions.
         */
        getPagesHealthCheck: {
            (params?: RestEndpointMethodTypes["repos"]["getPagesHealthCheck"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getPagesHealthCheck"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns the total commit counts for the `owner` and total commit counts in `all`. `all` is everyone combined, including the `owner` in the last 52 weeks. If you'd like to get the commit counts for non-owners, you can subtract `owner` from `all`.
         *
         * The array order is oldest week (index 0) to most recent week.
         *
         * The most recent week is seven days ago at UTC midnight to today at UTC midnight.
         */
        getParticipationStats: {
            (params?: RestEndpointMethodTypes["repos"]["getParticipationStats"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getParticipationStats"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        getPullRequestReviewProtection: {
            (params?: RestEndpointMethodTypes["repos"]["getPullRequestReviewProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getPullRequestReviewProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Each array contains the day number, hour number, and number of commits:
         *
         * *   `0-6`: Sunday - Saturday
         * *   `0-23`: Hour of day
         * *   Number of commits
         *
         * For example, `[2, 14, 25]` indicates that there were 25 total commits, during the 2:00pm hour on Tuesdays. All times are based on the time zone of individual commits.
         */
        getPunchCardStats: {
            (params?: RestEndpointMethodTypes["repos"]["getPunchCardStats"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getPunchCardStats"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the preferred README for a repository.
         *
         * READMEs support [custom media types](https://docs.github.com/rest/reference/repos#custom-media-types) for retrieving the raw content or rendered HTML.
         */
        getReadme: {
            (params?: RestEndpointMethodTypes["repos"]["getReadme"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getReadme"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets the README from a repository directory.
         *
         * READMEs support [custom media types](https://docs.github.com/rest/reference/repos#custom-media-types) for retrieving the raw content or rendered HTML.
         */
        getReadmeInDirectory: {
            (params?: RestEndpointMethodTypes["repos"]["getReadmeInDirectory"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getReadmeInDirectory"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** This returns an `upload_url` key corresponding to the endpoint for uploading release assets. This key is a [hypermedia resource](https://docs.github.com/rest/overview/resources-in-the-rest-api#hypermedia).
         */
        getRelease: {
            (params?: RestEndpointMethodTypes["repos"]["getRelease"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getRelease"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * To download the asset's binary content, set the `Accept` header of the request to [`application/octet-stream`](https://docs.github.com/rest/overview/media-types). The API will either redirect the client to the location, or stream it directly if possible. API clients should handle both a `200` or `302` response.
         */
        getReleaseAsset: {
            (params?: RestEndpointMethodTypes["repos"]["getReleaseAsset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getReleaseAsset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get a published release with the specified tag.
         */
        getReleaseByTag: {
            (params?: RestEndpointMethodTypes["repos"]["getReleaseByTag"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getReleaseByTag"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get a ruleset for a repository.
         */
        getRepoRuleset: {
            (params?: RestEndpointMethodTypes["repos"]["getRepoRuleset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getRepoRuleset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get all the rulesets for a repository.
         */
        getRepoRulesets: {
            (params?: RestEndpointMethodTypes["repos"]["getRepoRulesets"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getRepoRulesets"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        getStatusChecksProtection: {
            (params?: RestEndpointMethodTypes["repos"]["getStatusChecksProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getStatusChecksProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Lists the teams who have push access to this branch. The list includes child teams.
         */
        getTeamsWithAccessToProtectedBranch: {
            (params?: RestEndpointMethodTypes["repos"]["getTeamsWithAccessToProtectedBranch"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getTeamsWithAccessToProtectedBranch"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get the top 10 popular contents over the last 14 days.
         */
        getTopPaths: {
            (params?: RestEndpointMethodTypes["repos"]["getTopPaths"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getTopPaths"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get the top 10 referrers over the last 14 days.
         */
        getTopReferrers: {
            (params?: RestEndpointMethodTypes["repos"]["getTopReferrers"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getTopReferrers"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Lists the people who have push access to this branch.
         */
        getUsersWithAccessToProtectedBranch: {
            (params?: RestEndpointMethodTypes["repos"]["getUsersWithAccessToProtectedBranch"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getUsersWithAccessToProtectedBranch"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get the total number of views and breakdown per day or week for the last 14 days. Timestamps are aligned to UTC midnight of the beginning of the day or week. Week begins on Monday.
         */
        getViews: {
            (params?: RestEndpointMethodTypes["repos"]["getViews"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getViews"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a webhook configured in a repository. To get only the webhook `config` properties, see "[Get a webhook configuration for a repository](/rest/reference/repos#get-a-webhook-configuration-for-a-repository)."
         */
        getWebhook: {
            (params?: RestEndpointMethodTypes["repos"]["getWebhook"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getWebhook"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns the webhook configuration for a repository. To get more information about the webhook, including the `active` state and `events`, use "[Get a repository webhook](/rest/reference/orgs#get-a-repository-webhook)."
         *
         * Access tokens must have the `read:repo_hook` or `repo` scope, and GitHub Apps must have the `repository_hooks:read` permission.
         */
        getWebhookConfigForRepo: {
            (params?: RestEndpointMethodTypes["repos"]["getWebhookConfigForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getWebhookConfigForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a delivery for a webhook configured in a repository.
         */
        getWebhookDelivery: {
            (params?: RestEndpointMethodTypes["repos"]["getWebhookDelivery"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["getWebhookDelivery"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This returns a list of autolinks configured for the given repository.
         *
         * Information about autolinks are only available to repository administrators.
         */
        listAutolinks: {
            (params?: RestEndpointMethodTypes["repos"]["listAutolinks"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listAutolinks"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listBranches: {
            (params?: RestEndpointMethodTypes["repos"]["listBranches"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listBranches"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Returns all branches where the given commit SHA is the HEAD, or latest commit for the branch.
         */
        listBranchesForHeadCommit: {
            (params?: RestEndpointMethodTypes["repos"]["listBranchesForHeadCommit"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listBranchesForHeadCommit"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * For organization-owned repositories, the list of collaborators includes outside collaborators, organization members that are direct collaborators, organization members with access through team memberships, organization members with access through default organization permissions, and organization owners.
         * Organization members with write, maintain, or admin privileges on the organization-owned repository can use this endpoint.
         *
         * Team members will include the members of child teams.
         *
         * You must authenticate using an access token with the `read:org` and `repo` scopes with push access to use this
         * endpoint. GitHub Apps must have the `members` organization permission and `metadata` repository permission to use this
         * endpoint.
         */
        listCollaborators: {
            (params?: RestEndpointMethodTypes["repos"]["listCollaborators"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listCollaborators"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Use the `:commit_sha` to specify the commit that will have its comments listed.
         */
        listCommentsForCommit: {
            (params?: RestEndpointMethodTypes["repos"]["listCommentsForCommit"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listCommentsForCommit"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Commit Comments use [these custom media types](https://docs.github.com/rest/reference/repos#custom-media-types). You can read more about the use of media types in the API [here](https://docs.github.com/rest/overview/media-types/).
         *
         * Comments are ordered by ascending ID.
         */
        listCommitCommentsForRepo: {
            (params?: RestEndpointMethodTypes["repos"]["listCommitCommentsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listCommitCommentsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with pull access in a repository can view commit statuses for a given ref. The ref can be a SHA, a branch name, or a tag name. Statuses are returned in reverse chronological order. The first status in the list will be the latest one.
         *
         * This resource is also available via a legacy route: `GET /repos/:owner/:repo/statuses/:ref`.
         */
        listCommitStatusesForRef: {
            (params?: RestEndpointMethodTypes["repos"]["listCommitStatusesForRef"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listCommitStatusesForRef"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Signature verification object**
         *
         * The response will include a `verification` object that describes the result of verifying the commit's signature. The following fields are included in the `verification` object:
         *
         * | Name | Type | Description |
         * | ---- | ---- | ----------- |
         * | `verified` | `boolean` | Indicates whether GitHub considers the signature in this commit to be verified. |
         * | `reason` | `string` | The reason for verified value. Possible values and their meanings are enumerated in table below. |
         * | `signature` | `string` | The signature that was extracted from the commit. |
         * | `payload` | `string` | The value that was signed. |
         *
         * These are the possible values for `reason` in the `verification` object:
         *
         * | Value | Description |
         * | ----- | ----------- |
         * | `expired_key` | The key that made the signature is expired. |
         * | `not_signing_key` | The "signing" flag is not among the usage flags in the GPG key that made the signature. |
         * | `gpgverify_error` | There was an error communicating with the signature verification service. |
         * | `gpgverify_unavailable` | The signature verification service is currently unavailable. |
         * | `unsigned` | The object does not include a signature. |
         * | `unknown_signature_type` | A non-PGP signature was found in the commit. |
         * | `no_user` | No user was associated with the `committer` email address in the commit. |
         * | `unverified_email` | The `committer` email address in the commit was associated with a user, but the email address is not verified on their account. |
         * | `bad_email` | The `committer` email address in the commit is not included in the identities of the PGP key that made the signature. |
         * | `unknown_key` | The key that made the signature has not been registered with any user's account. |
         * | `malformed_signature` | There was an error parsing the signature. |
         * | `invalid` | The signature could not be cryptographically verified using the key whose key-id was found in the signature. |
         * | `valid` | None of the above errors applied, so the signature is considered to be verified. |
         */
        listCommits: {
            (params?: RestEndpointMethodTypes["repos"]["listCommits"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listCommits"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists contributors to the specified repository and sorts them by the number of commits per contributor in descending order. This endpoint may return information that is a few hours old because the GitHub REST API caches contributor data to improve performance.
         *
         * GitHub identifies contributors by author email address. This endpoint groups contribution counts by GitHub user, which includes all associated email addresses. To improve performance, only the first 500 author email addresses in the repository link to GitHub users. The rest will appear as anonymous contributors without associated GitHub user information.
         */
        listContributors: {
            (params?: RestEndpointMethodTypes["repos"]["listContributors"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listContributors"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets all custom deployment protection rule integrations that are available for an environment. Anyone with read access to the repository can use this endpoint. If the repository is private and you want to use a personal access token (classic), you must use an access token with the `repo` scope. GitHub Apps and fine-grained personal access tokens must have the `actions:read` permission to use this endpoint.
         *
         * For more information about environments, see "[Using environments for deployment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)."
         *
         * For more information about the app that is providing this custom deployment rule, see "[GET an app](https://docs.github.com/rest/apps/apps#get-an-app)".
         */
        listCustomDeploymentRuleIntegrations: {
            (params?: RestEndpointMethodTypes["repos"]["listCustomDeploymentRuleIntegrations"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listCustomDeploymentRuleIntegrations"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listDeployKeys: {
            (params?: RestEndpointMethodTypes["repos"]["listDeployKeys"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listDeployKeys"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the deployment branch policies for an environment.
         *
         * Anyone with read access to the repository can use this endpoint. If the repository is private, you must use an access token with the `repo` scope. GitHub Apps must have the `actions:read` permission to use this endpoint.
         */
        listDeploymentBranchPolicies: {
            (params?: RestEndpointMethodTypes["repos"]["listDeploymentBranchPolicies"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listDeploymentBranchPolicies"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with pull access can view deployment statuses for a deployment:
         */
        listDeploymentStatuses: {
            (params?: RestEndpointMethodTypes["repos"]["listDeploymentStatuses"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listDeploymentStatuses"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Simple filtering of deployments is available via query parameters:
         */
        listDeployments: {
            (params?: RestEndpointMethodTypes["repos"]["listDeployments"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listDeployments"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists repositories that the authenticated user has explicit permission (`:read`, `:write`, or `:admin`) to access.
         *
         * The authenticated user has explicit permission to access repositories they own, repositories where they are a collaborator, and repositories that they can access through an organization membership.
         */
        listForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["repos"]["listForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists repositories for the specified organization.
         *
         * **Note:** In order to see the `security_and_analysis` block for a repository you must have admin permissions for the repository or be an owner or security manager for the organization that owns the repository. For more information, see "[Managing security managers in your organization](https://docs.github.com/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization)."
         */
        listForOrg: {
            (params?: RestEndpointMethodTypes["repos"]["listForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists public repositories for the specified user. Note: For GitHub AE, this endpoint will list internal repositories for the specified user.
         */
        listForUser: {
            (params?: RestEndpointMethodTypes["repos"]["listForUser"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listForks: {
            (params?: RestEndpointMethodTypes["repos"]["listForks"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listForks"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * When authenticating as a user with admin rights to a repository, this endpoint will list all currently open repository invitations.
         */
        listInvitations: {
            (params?: RestEndpointMethodTypes["repos"]["listInvitations"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listInvitations"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * When authenticating as a user, this endpoint will list all currently open repository invitations for that user.
         */
        listInvitationsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["repos"]["listInvitationsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listInvitationsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists languages for the specified repository. The value shown for each language is the number of bytes of code written in that language.
         */
        listLanguages: {
            (params?: RestEndpointMethodTypes["repos"]["listLanguages"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listLanguages"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists builts of a GitHub Pages site.
         *
         * A token with the `repo` scope is required. GitHub Apps must have the `pages:read` permission.
         */
        listPagesBuilds: {
            (params?: RestEndpointMethodTypes["repos"]["listPagesBuilds"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listPagesBuilds"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all public repositories in the order that they were created.
         *
         * Note:
         * - For GitHub Enterprise Server, this endpoint will only list repositories available to all users on the enterprise.
         * - Pagination is powered exclusively by the `since` parameter. Use the [Link header](https://docs.github.com/rest/guides/using-pagination-in-the-rest-api#using-link-headers) to get the URL for the next page of repositories.
         */
        listPublic: {
            (params?: RestEndpointMethodTypes["repos"]["listPublic"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listPublic"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the merged pull request that introduced the commit to the repository. If the commit is not present in the default branch, will only return open pull requests associated with the commit.
         */
        listPullRequestsAssociatedWithCommit: {
            (params?: RestEndpointMethodTypes["repos"]["listPullRequestsAssociatedWithCommit"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listPullRequestsAssociatedWithCommit"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listReleaseAssets: {
            (params?: RestEndpointMethodTypes["repos"]["listReleaseAssets"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listReleaseAssets"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This returns a list of releases, which does not include regular Git tags that have not been associated with a release. To get a list of Git tags, use the [Repository Tags API](https://docs.github.com/rest/reference/repos#list-repository-tags).
         *
         * Information about published releases are available to everyone. Only users with push access will receive listings for draft releases.
         */
        listReleases: {
            (params?: RestEndpointMethodTypes["repos"]["listReleases"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listReleases"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This returns the tag protection states of a repository.
         *
         * This information is only available to repository administrators.
         */
        listTagProtection: {
            (params?: RestEndpointMethodTypes["repos"]["listTagProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listTagProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        listTags: {
            (params?: RestEndpointMethodTypes["repos"]["listTags"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listTags"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the teams that have access to the specified repository and that are also visible to the authenticated user.
         *
         * For a public repository, a team is listed only if that team added the public repository explicitly.
         *
         * Personal access tokens require the following scopes:
         * * `public_repo` to call this endpoint on a public repository
         * * `repo` to call this endpoint on a private repository (this scope also includes public repositories)
         *
         * This endpoint is not compatible with fine-grained personal access tokens.
         */
        listTeams: {
            (params?: RestEndpointMethodTypes["repos"]["listTeams"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listTeams"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Returns a list of webhook deliveries for a webhook configured in a repository.
         */
        listWebhookDeliveries: {
            (params?: RestEndpointMethodTypes["repos"]["listWebhookDeliveries"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listWebhookDeliveries"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists webhooks for a repository. `last response` may return null if there have not been any deliveries within 30 days.
         */
        listWebhooks: {
            (params?: RestEndpointMethodTypes["repos"]["listWebhooks"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["listWebhooks"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        merge: {
            (params?: RestEndpointMethodTypes["repos"]["merge"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["merge"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sync a branch of a forked repository to keep it up-to-date with the upstream repository.
         */
        mergeUpstream: {
            (params?: RestEndpointMethodTypes["repos"]["mergeUpstream"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["mergeUpstream"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This will trigger a [ping event](https://docs.github.com/webhooks/#ping-event) to be sent to the hook.
         */
        pingWebhook: {
            (params?: RestEndpointMethodTypes["repos"]["pingWebhook"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["pingWebhook"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Redeliver a webhook delivery for a webhook configured in a repository.
         */
        redeliverWebhookDelivery: {
            (params?: RestEndpointMethodTypes["repos"]["redeliverWebhookDelivery"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["redeliverWebhookDelivery"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Removes the ability of an app to push to this branch. Only installed GitHub Apps with `write` access to the `contents` permission can be added as authorized actors on a protected branch.
         */
        removeAppAccessRestrictions: {
            (params?: RestEndpointMethodTypes["repos"]["removeAppAccessRestrictions"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["removeAppAccessRestrictions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a collaborator from a repository.
         *
         * To use this endpoint, the authenticated user must either be an administrator of the repository or target themselves for removal.
         *
         * This endpoint also:
         * - Cancels any outstanding invitations
         * - Unasigns the user from any issues
         * - Removes access to organization projects if the user is not an organization member and is not a collaborator on any other organization repositories.
         * - Unstars the repository
         * - Updates access permissions to packages
         *
         * Removing a user as a collaborator has the following effects on forks:
         *  - If the user had access to a fork through their membership to this repository, the user will also be removed from the fork.
         *  - If the user had their own fork of the repository, the fork will be deleted.
         *  - If the user still has read access to the repository, open pull requests by this user from a fork will be denied.
         *
         * **Note**: A user can still have access to the repository through organization permissions like base repository permissions.
         *
         * Although the API responds immediately, the additional permission updates might take some extra time to complete in the background.
         *
         * For more information on fork permissions, see "[About permissions and visibility of forks](https://docs.github.com/pull-requests/collaborating-with-pull-requests/working-with-forks/about-permissions-and-visibility-of-forks)".
         */
        removeCollaborator: {
            (params?: RestEndpointMethodTypes["repos"]["removeCollaborator"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["removeCollaborator"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        removeStatusCheckContexts: {
            (params?: RestEndpointMethodTypes["repos"]["removeStatusCheckContexts"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["removeStatusCheckContexts"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        removeStatusCheckProtection: {
            (params?: RestEndpointMethodTypes["repos"]["removeStatusCheckProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["removeStatusCheckProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Removes the ability of a team to push to this branch. You can also remove push access for child teams.
         */
        removeTeamAccessRestrictions: {
            (params?: RestEndpointMethodTypes["repos"]["removeTeamAccessRestrictions"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["removeTeamAccessRestrictions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Removes the ability of a user to push to this branch.
         *
         * | Type    | Description                                                                                                                                   |
         * | ------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
         * | `array` | Usernames of the people who should no longer have push access. **Note**: The list of users, apps, and teams in total is limited to 100 items. |
         */
        removeUserAccessRestrictions: {
            (params?: RestEndpointMethodTypes["repos"]["removeUserAccessRestrictions"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["removeUserAccessRestrictions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Renames a branch in a repository.
         *
         * **Note:** Although the API responds immediately, the branch rename process might take some extra time to complete in the background. You won't be able to push to the old branch name while the rename process is in progress. For more information, see "[Renaming a branch](https://docs.github.com/github/administering-a-repository/renaming-a-branch)".
         *
         * The permissions required to use this endpoint depends on whether you are renaming the default branch.
         *
         * To rename a non-default branch:
         *
         * * Users must have push access.
         * * GitHub Apps must have the `contents:write` repository permission.
         *
         * To rename the default branch:
         *
         * * Users must have admin or owner permissions.
         * * GitHub Apps must have the `administration:write` repository permission.
         */
        renameBranch: {
            (params?: RestEndpointMethodTypes["repos"]["renameBranch"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["renameBranch"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        replaceAllTopics: {
            (params?: RestEndpointMethodTypes["repos"]["replaceAllTopics"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["replaceAllTopics"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * You can request that your site be built from the latest revision on the default branch. This has the same effect as pushing a commit to your default branch, but does not require an additional commit. Manually triggering page builds can be helpful when diagnosing build warnings and failures.
         *
         * Build requests are limited to one concurrent build per repository and one concurrent build per requester. If you request a build while another is still in progress, the second request will be queued until the first completes.
         */
        requestPagesBuild: {
            (params?: RestEndpointMethodTypes["repos"]["requestPagesBuild"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["requestPagesBuild"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Adding admin enforcement requires admin or owner permissions to the repository and branch protection to be enabled.
         */
        setAdminBranchProtection: {
            (params?: RestEndpointMethodTypes["repos"]["setAdminBranchProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["setAdminBranchProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Replaces the list of apps that have push access to this branch. This removes all apps that previously had push access and grants push access to the new list of apps. Only installed GitHub Apps with `write` access to the `contents` permission can be added as authorized actors on a protected branch.
         */
        setAppAccessRestrictions: {
            (params?: RestEndpointMethodTypes["repos"]["setAppAccessRestrictions"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["setAppAccessRestrictions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         */
        setStatusCheckContexts: {
            (params?: RestEndpointMethodTypes["repos"]["setStatusCheckContexts"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["setStatusCheckContexts"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Replaces the list of teams that have push access to this branch. This removes all teams that previously had push access and grants push access to the new list of teams. Team restrictions include child teams.
         */
        setTeamAccessRestrictions: {
            (params?: RestEndpointMethodTypes["repos"]["setTeamAccessRestrictions"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["setTeamAccessRestrictions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Replaces the list of people that have push access to this branch. This removes all people that previously had push access and grants push access to the new list of people.
         *
         * | Type    | Description                                                                                                                   |
         * | ------- | ----------------------------------------------------------------------------------------------------------------------------- |
         * | `array` | Usernames for people who can have push access. **Note**: The list of users, apps, and teams in total is limited to 100 items. |
         */
        setUserAccessRestrictions: {
            (params?: RestEndpointMethodTypes["repos"]["setUserAccessRestrictions"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["setUserAccessRestrictions"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This will trigger the hook with the latest push to the current repository if the hook is subscribed to `push` events. If the hook is not subscribed to `push` events, the server will respond with 204 but no test POST will be generated.
         *
         * **Note**: Previously `/repos/:owner/:repo/hooks/:hook_id/test`
         */
        testPushWebhook: {
            (params?: RestEndpointMethodTypes["repos"]["testPushWebhook"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["testPushWebhook"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * A transfer request will need to be accepted by the new owner when transferring a personal repository to another user. The response will contain the original `owner`, and the transfer will continue asynchronously. For more details on the requirements to transfer personal and organization-owned repositories, see [about repository transfers](https://docs.github.com/articles/about-repository-transfers/).
         */
        transfer: {
            (params?: RestEndpointMethodTypes["repos"]["transfer"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["transfer"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note**: To edit a repository's topics, use the [Replace all repository topics](https://docs.github.com/rest/reference/repos#replace-all-repository-topics) endpoint.
         */
        update: {
            (params?: RestEndpointMethodTypes["repos"]["update"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["update"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Protecting a branch requires admin or owner permissions to the repository.
         *
         * **Note**: Passing new arrays of `users` and `teams` replaces their previous values.
         *
         * **Note**: The list of users, apps, and teams in total is limited to 100 items.
         */
        updateBranchProtection: {
            (params?: RestEndpointMethodTypes["repos"]["updateBranchProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateBranchProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        updateCommitComment: {
            (params?: RestEndpointMethodTypes["repos"]["updateCommitComment"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateCommitComment"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates a deployment branch policy for an environment.
         *
         * You must authenticate using an access token with the `repo` scope to use this endpoint. GitHub Apps must have the `administration:write` permission for the repository to use this endpoint.
         */
        updateDeploymentBranchPolicy: {
            (params?: RestEndpointMethodTypes["repos"]["updateDeploymentBranchPolicy"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateDeploymentBranchPolicy"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates information for a GitHub Pages site. For more information, see "[About GitHub Pages](/github/working-with-github-pages/about-github-pages).
         *
         * To use this endpoint, you must be a repository administrator, maintainer, or have the 'manage GitHub Pages settings' permission. A token with the `repo` scope or Pages write permission is required. GitHub Apps must have the `administration:write` and `pages:write` permissions.
         */
        updateInformationAboutPagesSite: {
            (params?: RestEndpointMethodTypes["repos"]["updateInformationAboutPagesSite"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateInformationAboutPagesSite"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        updateInvitation: {
            (params?: RestEndpointMethodTypes["repos"]["updateInvitation"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateInvitation"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Update a ruleset for an organization.
         */
        updateOrgRuleset: {
            (params?: RestEndpointMethodTypes["repos"]["updateOrgRuleset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateOrgRuleset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Updating pull request review enforcement requires admin or owner permissions to the repository and branch protection to be enabled.
         *
         * **Note**: Passing new arrays of `users` and `teams` replaces their previous values.
         */
        updatePullRequestReviewProtection: {
            (params?: RestEndpointMethodTypes["repos"]["updatePullRequestReviewProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updatePullRequestReviewProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with push access to the repository can edit a release.
         */
        updateRelease: {
            (params?: RestEndpointMethodTypes["repos"]["updateRelease"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateRelease"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Users with push access to the repository can edit a release asset.
         */
        updateReleaseAsset: {
            (params?: RestEndpointMethodTypes["repos"]["updateReleaseAsset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateReleaseAsset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Update a ruleset for a repository.
         */
        updateRepoRuleset: {
            (params?: RestEndpointMethodTypes["repos"]["updateRepoRuleset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateRepoRuleset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Updating required status checks requires admin or owner permissions to the repository and branch protection to be enabled.
         * @deprecated octokit.rest.repos.updateStatusCheckPotection() has been renamed to octokit.rest.repos.updateStatusCheckProtection() (2020-09-17)
         */
        updateStatusCheckPotection: {
            (params?: RestEndpointMethodTypes["repos"]["updateStatusCheckPotection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateStatusCheckPotection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Protected branches are available in public repositories with GitHub Free and GitHub Free for organizations, and in public and private repositories with GitHub Pro, GitHub Team, GitHub Enterprise Cloud, and GitHub Enterprise Server. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * Updating required status checks requires admin or owner permissions to the repository and branch protection to be enabled.
         */
        updateStatusCheckProtection: {
            (params?: RestEndpointMethodTypes["repos"]["updateStatusCheckProtection"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateStatusCheckProtection"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates a webhook configured in a repository. If you previously had a `secret` set, you must provide the same `secret` or set a new `secret` or the secret will be removed. If you are only updating individual webhook `config` properties, use "[Update a webhook configuration for a repository](/rest/reference/repos#update-a-webhook-configuration-for-a-repository)."
         */
        updateWebhook: {
            (params?: RestEndpointMethodTypes["repos"]["updateWebhook"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateWebhook"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates the webhook configuration for a repository. To update more information about the webhook, including the `active` state and `events`, use "[Update a repository webhook](/rest/reference/orgs#update-a-repository-webhook)."
         *
         * Access tokens must have the `write:repo_hook` or `repo` scope, and GitHub Apps must have the `repository_hooks:write` permission.
         */
        updateWebhookConfigForRepo: {
            (params?: RestEndpointMethodTypes["repos"]["updateWebhookConfigForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["updateWebhookConfigForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This endpoint makes use of [a Hypermedia relation](https://docs.github.com/rest/overview/resources-in-the-rest-api#hypermedia) to determine which URL to access. The endpoint you call to upload release assets is specific to your release. Use the `upload_url` returned in
         * the response of the [Create a release endpoint](https://docs.github.com/rest/releases/releases#create-a-release) to upload a release asset.
         *
         * You need to use an HTTP client which supports [SNI](http://en.wikipedia.org/wiki/Server_Name_Indication) to make calls to this endpoint.
         *
         * Most libraries will set the required `Content-Length` header automatically. Use the required `Content-Type` header to provide the media type of the asset. For a list of media types, see [Media Types](https://www.iana.org/assignments/media-types/media-types.xhtml). For example:
         *
         * `application/zip`
         *
         * GitHub expects the asset data in its raw binary form, rather than JSON. You will send the raw binary content of the asset as the request body. Everything else about the endpoint is the same as the rest of the API. For example,
         * you'll still need to pass your authentication to be able to upload an asset.
         *
         * When an upstream failure occurs, you will receive a `502 Bad Gateway` status. This may leave an empty asset with a state of `starter`. It can be safely deleted.
         *
         * **Notes:**
         * *   GitHub renames asset filenames that have special characters, non-alphanumeric characters, and leading or trailing periods. The "[List assets for a release](https://docs.github.com/rest/reference/repos#list-assets-for-a-release)"
         * endpoint lists the renamed filenames. For more information and help, contact [GitHub Support](https://support.github.com/contact?tags=dotcom-rest-api).
         * *   To find the `release_id` query the [`GET /repos/{owner}/{repo}/releases/latest` endpoint](https://docs.github.com/rest/releases/releases#get-the-latest-release).
         * *   If you upload an asset with the same filename as another uploaded asset, you'll receive an error and must delete the old file before you can re-upload the new asset.
         */
        uploadReleaseAsset: {
            (params?: RestEndpointMethodTypes["repos"]["uploadReleaseAsset"]["parameters"]): Promise<RestEndpointMethodTypes["repos"]["uploadReleaseAsset"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    search: {
        /**
         * Searches for query terms inside of a file. This method returns up to 100 results [per page](https://docs.github.com/rest/overview/resources-in-the-rest-api#pagination).
         *
         * When searching for code, you can get text match metadata for the file **content** and file **path** fields when you pass the `text-match` media type. For more details about how to receive highlighted search results, see [Text match metadata](https://docs.github.com/rest/reference/search#text-match-metadata).
         *
         * For example, if you want to find the definition of the `addClass` function inside [jQuery](https://github.com/jquery/jquery) repository, your query would look something like this:
         *
         * `q=addClass+in:file+language:js+repo:jquery/jquery`
         *
         * This query searches for the keyword `addClass` within a file's contents. The query limits the search to files where the language is JavaScript in the `jquery/jquery` repository.
         *
         * #### Considerations for code search
         *
         * Due to the complexity of searching code, there are a few restrictions on how searches are performed:
         *
         * *   Only the _default branch_ is considered. In most cases, this will be the `master` branch.
         * *   Only files smaller than 384 KB are searchable.
         * *   You must always include at least one search term when searching source code. For example, searching for [`language:go`](https://github.com/search?utf8=%E2%9C%93&q=language%3Ago&type=Code) is not valid, while [`amazing
         * language:go`](https://github.com/search?utf8=%E2%9C%93&q=amazing+language%3Ago&type=Code) is.
         *
         * This endpoint requires you to authenticate and limits you to 10 requests per minute.
         */
        code: {
            (params?: RestEndpointMethodTypes["search"]["code"]["parameters"]): Promise<RestEndpointMethodTypes["search"]["code"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Find commits via various criteria on the default branch (usually `main`). This method returns up to 100 results [per page](https://docs.github.com/rest/overview/resources-in-the-rest-api#pagination).
         *
         * When searching for commits, you can get text match metadata for the **message** field when you provide the `text-match` media type. For more details about how to receive highlighted search results, see [Text match
         * metadata](https://docs.github.com/rest/reference/search#text-match-metadata).
         *
         * For example, if you want to find commits related to CSS in the [octocat/Spoon-Knife](https://github.com/octocat/Spoon-Knife) repository. Your query would look something like this:
         *
         * `q=repo:octocat/Spoon-Knife+css`
         */
        commits: {
            (params?: RestEndpointMethodTypes["search"]["commits"]["parameters"]): Promise<RestEndpointMethodTypes["search"]["commits"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Find issues by state and keyword. This method returns up to 100 results [per page](https://docs.github.com/rest/overview/resources-in-the-rest-api#pagination).
         *
         * When searching for issues, you can get text match metadata for the issue **title**, issue **body**, and issue **comment body** fields when you pass the `text-match` media type. For more details about how to receive highlighted
         * search results, see [Text match metadata](https://docs.github.com/rest/reference/search#text-match-metadata).
         *
         * For example, if you want to find the oldest unresolved Python bugs on Windows. Your query might look something like this.
         *
         * `q=windows+label:bug+language:python+state:open&sort=created&order=asc`
         *
         * This query searches for the keyword `windows`, within any open issue that is labeled as `bug`. The search runs across repositories whose primary language is Python. The results are sorted by creation date in ascending order, which means the oldest issues appear first in the search results.
         *
         * **Note:** For [user-to-server](https://docs.github.com/developers/apps/identifying-and-authorizing-users-for-github-apps#user-to-server-requests) GitHub App requests, you can't retrieve a combination of issues and pull requests in a single query. Requests that don't include the `is:issue` or `is:pull-request` qualifier will receive an HTTP `422 Unprocessable Entity` response. To get results for both issues and pull requests, you must send separate queries for issues and pull requests. For more information about the `is` qualifier, see "[Searching only issues or pull requests](https://docs.github.com/github/searching-for-information-on-github/searching-issues-and-pull-requests#search-only-issues-or-pull-requests)."
         */
        issuesAndPullRequests: {
            (params?: RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["parameters"]): Promise<RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Find labels in a repository with names or descriptions that match search keywords. Returns up to 100 results [per page](https://docs.github.com/rest/overview/resources-in-the-rest-api#pagination).
         *
         * When searching for labels, you can get text match metadata for the label **name** and **description** fields when you pass the `text-match` media type. For more details about how to receive highlighted search results, see [Text match metadata](https://docs.github.com/rest/reference/search#text-match-metadata).
         *
         * For example, if you want to find labels in the `linguist` repository that match `bug`, `defect`, or `enhancement`. Your query might look like this:
         *
         * `q=bug+defect+enhancement&repository_id=64778136`
         *
         * The labels that best match the query appear first in the search results.
         */
        labels: {
            (params?: RestEndpointMethodTypes["search"]["labels"]["parameters"]): Promise<RestEndpointMethodTypes["search"]["labels"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Find repositories via various criteria. This method returns up to 100 results [per page](https://docs.github.com/rest/overview/resources-in-the-rest-api#pagination).
         *
         * When searching for repositories, you can get text match metadata for the **name** and **description** fields when you pass the `text-match` media type. For more details about how to receive highlighted search results, see [Text match metadata](https://docs.github.com/rest/reference/search#text-match-metadata).
         *
         * For example, if you want to search for popular Tetris repositories written in assembly code, your query might look like this:
         *
         * `q=tetris+language:assembly&sort=stars&order=desc`
         *
         * This query searches for repositories with the word `tetris` in the name, the description, or the README. The results are limited to repositories where the primary language is assembly. The results are sorted by stars in descending order, so that the most popular repositories appear first in the search results.
         */
        repos: {
            (params?: RestEndpointMethodTypes["search"]["repos"]["parameters"]): Promise<RestEndpointMethodTypes["search"]["repos"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Find topics via various criteria. Results are sorted by best match. This method returns up to 100 results [per page](https://docs.github.com/rest/overview/resources-in-the-rest-api#pagination). See "[Searching topics](https://docs.github.com/articles/searching-topics/)" for a detailed list of qualifiers.
         *
         * When searching for topics, you can get text match metadata for the topic's **short\_description**, **description**, **name**, or **display\_name** field when you pass the `text-match` media type. For more details about how to receive highlighted search results, see [Text match metadata](https://docs.github.com/rest/reference/search#text-match-metadata).
         *
         * For example, if you want to search for topics related to Ruby that are featured on https://github.com/topics. Your query might look like this:
         *
         * `q=ruby+is:featured`
         *
         * This query searches for topics with the keyword `ruby` and limits the results to find only topics that are featured. The topics that are the best match for the query appear first in the search results.
         */
        topics: {
            (params?: RestEndpointMethodTypes["search"]["topics"]["parameters"]): Promise<RestEndpointMethodTypes["search"]["topics"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Find users via various criteria. This method returns up to 100 results [per page](https://docs.github.com/rest/overview/resources-in-the-rest-api#pagination).
         *
         * When searching for users, you can get text match metadata for the issue **login**, public **email**, and **name** fields when you pass the `text-match` media type. For more details about highlighting search results, see [Text match metadata](https://docs.github.com/rest/reference/search#text-match-metadata). For more details about how to receive highlighted search results, see [Text match metadata](https://docs.github.com/rest/reference/search#text-match-metadata).
         *
         * For example, if you're looking for a list of popular users, you might try this query:
         *
         * `q=tom+repos:%3E42+followers:%3E1000`
         *
         * This query searches for users with the name `tom`. The results are restricted to users with more than 42 repositories and over 1,000 followers.
         */
        users: {
            (params?: RestEndpointMethodTypes["search"]["users"]["parameters"]): Promise<RestEndpointMethodTypes["search"]["users"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    secretScanning: {
        /**
         * Gets a single secret scanning alert detected in an eligible repository.
         * To use this endpoint, you must be an administrator for the repository or for the organization that owns the repository, and you must use a personal access token with the `repo` scope or `security_events` scope.
         * For public repositories, you may instead use the `public_repo` scope.
         *
         * GitHub Apps must have the `secret_scanning_alerts` read permission to use this endpoint.
         */
        getAlert: {
            (params?: RestEndpointMethodTypes["secretScanning"]["getAlert"]["parameters"]): Promise<RestEndpointMethodTypes["secretScanning"]["getAlert"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists secret scanning alerts for eligible repositories in an enterprise, from newest to oldest.
         * To use this endpoint, you must be a member of the enterprise, and you must use an access token with the `repo` scope or `security_events` scope. Alerts are only returned for organizations in the enterprise for which you are an organization owner or a [security manager](https://docs.github.com/organizations/managing-peoples-access-to-your-organization-with-roles/managing-security-managers-in-your-organization).
         */
        listAlertsForEnterprise: {
            (params?: RestEndpointMethodTypes["secretScanning"]["listAlertsForEnterprise"]["parameters"]): Promise<RestEndpointMethodTypes["secretScanning"]["listAlertsForEnterprise"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists secret scanning alerts for eligible repositories in an organization, from newest to oldest.
         * To use this endpoint, you must be an administrator or security manager for the organization, and you must use an access token with the `repo` scope or `security_events` scope.
         * For public repositories, you may instead use the `public_repo` scope.
         *
         * GitHub Apps must have the `secret_scanning_alerts` read permission to use this endpoint.
         */
        listAlertsForOrg: {
            (params?: RestEndpointMethodTypes["secretScanning"]["listAlertsForOrg"]["parameters"]): Promise<RestEndpointMethodTypes["secretScanning"]["listAlertsForOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists secret scanning alerts for an eligible repository, from newest to oldest.
         * To use this endpoint, you must be an administrator for the repository or for the organization that owns the repository, and you must use a personal access token with the `repo` scope or `security_events` scope.
         * For public repositories, you may instead use the `public_repo` scope.
         *
         * GitHub Apps must have the `secret_scanning_alerts` read permission to use this endpoint.
         */
        listAlertsForRepo: {
            (params?: RestEndpointMethodTypes["secretScanning"]["listAlertsForRepo"]["parameters"]): Promise<RestEndpointMethodTypes["secretScanning"]["listAlertsForRepo"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all locations for a given secret scanning alert for an eligible repository.
         * To use this endpoint, you must be an administrator for the repository or for the organization that owns the repository, and you must use a personal access token with the `repo` scope or `security_events` scope.
         * For public repositories, you may instead use the `public_repo` scope.
         *
         * GitHub Apps must have the `secret_scanning_alerts` read permission to use this endpoint.
         */
        listLocationsForAlert: {
            (params?: RestEndpointMethodTypes["secretScanning"]["listLocationsForAlert"]["parameters"]): Promise<RestEndpointMethodTypes["secretScanning"]["listLocationsForAlert"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Updates the status of a secret scanning alert in an eligible repository.
         * To use this endpoint, you must be an administrator for the repository or for the organization that owns the repository, and you must use a personal access token with the `repo` scope or `security_events` scope.
         * For public repositories, you may instead use the `public_repo` scope.
         *
         * GitHub Apps must have the `secret_scanning_alerts` write permission to use this endpoint.
         */
        updateAlert: {
            (params?: RestEndpointMethodTypes["secretScanning"]["updateAlert"]["parameters"]): Promise<RestEndpointMethodTypes["secretScanning"]["updateAlert"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    securityAdvisories: {
        /**
         * Report a security vulnerability to the maintainers of the repository.
         * See "[Privately reporting a security vulnerability](https://docs.github.com/code-security/security-advisories/guidance-on-reporting-and-writing/privately-reporting-a-security-vulnerability)" for more information about private vulnerability reporting.
         */
        createPrivateVulnerabilityReport: {
            (params?: RestEndpointMethodTypes["securityAdvisories"]["createPrivateVulnerabilityReport"]["parameters"]): Promise<RestEndpointMethodTypes["securityAdvisories"]["createPrivateVulnerabilityReport"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a new repository security advisory.
         * You must authenticate using an access token with the `repo` scope or `repository_advisories:write` permission to use this endpoint.
         *
         * In order to create a draft repository security advisory, you must be a security manager or administrator of that repository.
         */
        createRepositoryAdvisory: {
            (params?: RestEndpointMethodTypes["securityAdvisories"]["createRepositoryAdvisory"]["parameters"]): Promise<RestEndpointMethodTypes["securityAdvisories"]["createRepositoryAdvisory"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get a repository security advisory using its GitHub Security Advisory (GHSA) identifier.
         * You can access any published security advisory on a public repository.
         * You must authenticate using an access token with the `repo` scope or `repository_advisories:read` permission
         * in order to get a published security advisory in a private repository, or any unpublished security advisory that you have access to.
         *
         * You can access an unpublished security advisory from a repository if you are a security manager or administrator of that repository, or if you are a
         * collaborator on the security advisory.
         */
        getRepositoryAdvisory: {
            (params?: RestEndpointMethodTypes["securityAdvisories"]["getRepositoryAdvisory"]["parameters"]): Promise<RestEndpointMethodTypes["securityAdvisories"]["getRepositoryAdvisory"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists security advisories in a repository.
         * You must authenticate using an access token with the `repo` scope or `repository_advisories:read` permission
         * in order to get published security advisories in a private repository, or any unpublished security advisories that you have access to.
         *
         * You can access unpublished security advisories from a repository if you are a security manager or administrator of that repository, or if you are a collaborator on any security advisory.
         */
        listRepositoryAdvisories: {
            (params?: RestEndpointMethodTypes["securityAdvisories"]["listRepositoryAdvisories"]["parameters"]): Promise<RestEndpointMethodTypes["securityAdvisories"]["listRepositoryAdvisories"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Update a repository security advisory using its GitHub Security Advisory (GHSA) identifier.
         * You must authenticate using an access token with the `repo` scope or `repository_advisories:write` permission to use this endpoint.
         *
         * In order to update any security advisory, you must be a security manager or administrator of that repository,
         * or a collaborator on the repository security advisory.
         */
        updateRepositoryAdvisory: {
            (params?: RestEndpointMethodTypes["securityAdvisories"]["updateRepositoryAdvisory"]["parameters"]): Promise<RestEndpointMethodTypes["securityAdvisories"]["updateRepositoryAdvisory"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    teams: {
        /**
         * Adds an organization member to a team. An authenticated organization owner or team maintainer can add organization members to a team.
         *
         * Team synchronization is available for organizations using GitHub Enterprise Cloud. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * **Note:** When you have team synchronization set up for a team with your organization's identity provider (IdP), you will see an error if you attempt to use the API for making changes to the team's membership. If you have access to manage group membership in your IdP, you can manage GitHub team membership through your identity provider, which automatically adds and removes team members in an organization. For more information, see "[Synchronizing teams between your identity provider and GitHub](https://docs.github.com/articles/synchronizing-teams-between-your-identity-provider-and-github/)."
         *
         * An organization owner can add someone who is not part of the team's organization to a team. When an organization owner adds someone to a team who is not an organization member, this endpoint will send an invitation to the person via email. This newly-created membership will be in the "pending" state until the person accepts the invitation, at which point the membership will transition to the "active" state and the user will be added as a member of the team.
         *
         * If the user is already a member of the team, this endpoint will update the role of the team member's role. To update the membership of a team member, the authenticated user must be an organization owner or a team maintainer.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `PUT /organizations/{org_id}/team/{team_id}/memberships/{username}`.
         */
        addOrUpdateMembershipForUserInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["addOrUpdateMembershipForUserInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["addOrUpdateMembershipForUserInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Adds an organization project to a team. To add a project to a team or update the team's permission on a project, the authenticated user must have `admin` permissions for the project. The project and team must be part of the same organization.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `PUT /organizations/{org_id}/team/{team_id}/projects/{project_id}`.
         */
        addOrUpdateProjectPermissionsInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["addOrUpdateProjectPermissionsInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["addOrUpdateProjectPermissionsInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * To add a repository to a team or update the team's permission on a repository, the authenticated user must have admin access to the repository, and must be able to see the team. The repository must be owned by the organization, or a direct fork of a repository owned by the organization. You will get a `422 Unprocessable Entity` status if you attempt to add a repository to a team that is not owned by the organization. Note that, if you choose not to pass any parameters, you'll need to set `Content-Length` to zero when calling out to this endpoint. For more information, see "[HTTP verbs](https://docs.github.com/rest/overview/resources-in-the-rest-api#http-verbs)."
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `PUT /organizations/{org_id}/team/{team_id}/repos/{owner}/{repo}`.
         *
         * For more information about the permission levels, see "[Repository permission levels for an organization](https://docs.github.com/github/setting-up-and-managing-organizations-and-teams/repository-permission-levels-for-an-organization#permission-levels-for-repositories-owned-by-an-organization)".
         */
        addOrUpdateRepoPermissionsInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["addOrUpdateRepoPermissionsInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["addOrUpdateRepoPermissionsInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Checks whether a team has `read`, `write`, or `admin` permissions for an organization project. The response includes projects inherited from a parent team.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}/projects/{project_id}`.
         */
        checkPermissionsForProjectInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["checkPermissionsForProjectInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["checkPermissionsForProjectInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Checks whether a team has `admin`, `push`, `maintain`, `triage`, or `pull` permission for a repository. Repositories inherited through a parent team will also be checked.
         *
         * You can also get information about the specified repository, including what permissions the team grants on it, by passing the following custom [media type](https://docs.github.com/rest/overview/media-types/) via the `application/vnd.github.v3.repository+json` accept header.
         *
         * If a team doesn't have permission for the repository, you will receive a `404 Not Found` response status.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}/repos/{owner}/{repo}`.
         */
        checkPermissionsForRepoInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["checkPermissionsForRepoInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["checkPermissionsForRepoInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * To create a team, the authenticated user must be a member or owner of `{org}`. By default, organization members can create teams. Organization owners can limit team creation to organization owners. For more information, see "[Setting team creation permissions](https://docs.github.com/articles/setting-team-creation-permissions-in-your-organization)."
         *
         * When you create a new team, you automatically become a team maintainer without explicitly adding yourself to the optional array of `maintainers`. For more information, see "[About teams](https://docs.github.com/github/setting-up-and-managing-organizations-and-teams/about-teams)".
         */
        create: {
            (params?: RestEndpointMethodTypes["teams"]["create"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["create"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a new comment on a team discussion. OAuth access tokens require the `write:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `POST /organizations/{org_id}/team/{team_id}/discussions/{discussion_number}/comments`.
         */
        createDiscussionCommentInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["createDiscussionCommentInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["createDiscussionCommentInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates a new discussion post on a team's page. OAuth access tokens require the `write:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * This endpoint triggers [notifications](https://docs.github.com/github/managing-subscriptions-and-notifications-on-github/about-notifications). Creating content too quickly using this endpoint may result in secondary rate limiting. See "[Secondary rate limits](https://docs.github.com/rest/overview/resources-in-the-rest-api#secondary-rate-limits)" and "[Dealing with secondary rate limits](https://docs.github.com/rest/guides/best-practices-for-integrators#dealing-with-secondary-rate-limits)" for details.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `POST /organizations/{org_id}/team/{team_id}/discussions`.
         */
        createDiscussionInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["createDiscussionInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["createDiscussionInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes a comment on a team discussion. OAuth access tokens require the `write:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `DELETE /organizations/{org_id}/team/{team_id}/discussions/{discussion_number}/comments/{comment_number}`.
         */
        deleteDiscussionCommentInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["deleteDiscussionCommentInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["deleteDiscussionCommentInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Delete a discussion from a team's page. OAuth access tokens require the `write:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `DELETE /organizations/{org_id}/team/{team_id}/discussions/{discussion_number}`.
         */
        deleteDiscussionInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["deleteDiscussionInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["deleteDiscussionInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * To delete a team, the authenticated user must be an organization owner or team maintainer.
         *
         * If you are an organization owner, deleting a parent team will delete all of its child teams as well.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `DELETE /organizations/{org_id}/team/{team_id}`.
         */
        deleteInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["deleteInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["deleteInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets a team using the team's `slug`. To create the `slug`, GitHub replaces special characters in the `name` string, changes all words to lowercase, and replaces spaces with a `-` separator. For example, `"My TEam Näme"` would become `my-team-name`.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}`.
         */
        getByName: {
            (params?: RestEndpointMethodTypes["teams"]["getByName"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["getByName"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get a specific comment on a team discussion. OAuth access tokens require the `read:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}/discussions/{discussion_number}/comments/{comment_number}`.
         */
        getDiscussionCommentInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["getDiscussionCommentInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["getDiscussionCommentInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Get a specific discussion on a team's page. OAuth access tokens require the `read:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}/discussions/{discussion_number}`.
         */
        getDiscussionInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["getDiscussionInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["getDiscussionInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Team members will include the members of child teams.
         *
         * To get a user's membership with a team, the team must be visible to the authenticated user.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}/memberships/{username}`.
         *
         * **Note:**
         * The response contains the `state` of the membership and the member's `role`.
         *
         * The `role` for organization owners is set to `maintainer`. For more information about `maintainer` roles, see see [Create a team](https://docs.github.com/rest/reference/teams#create-a-team).
         */
        getMembershipForUserInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["getMembershipForUserInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["getMembershipForUserInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all teams in an organization that are visible to the authenticated user.
         */
        list: {
            (params?: RestEndpointMethodTypes["teams"]["list"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["list"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the child teams of the team specified by `{team_slug}`.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}/teams`.
         */
        listChildInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["listChildInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["listChildInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all comments on a team discussion. OAuth access tokens require the `read:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}/discussions/{discussion_number}/comments`.
         */
        listDiscussionCommentsInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["listDiscussionCommentsInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["listDiscussionCommentsInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all discussions on a team's page. OAuth access tokens require the `read:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}/discussions`.
         */
        listDiscussionsInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["listDiscussionsInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["listDiscussionsInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List all of the teams across all of the organizations to which the authenticated user belongs. This method requires `user`, `repo`, or `read:org` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/) when authenticating via [OAuth](https://docs.github.com/apps/building-oauth-apps/). When using a fine-grained personal access token, the resource owner of the token [must be a single organization](https://docs.github.com/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token#fine-grained-personal-access-tokens), and have at least read-only member organization permissions. The response payload only contains the teams from a single organization when using a fine-grained personal access token.
         */
        listForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["teams"]["listForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["listForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Team members will include the members of child teams.
         *
         * To list members in a team, the team must be visible to the authenticated user.
         */
        listMembersInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["listMembersInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["listMembersInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * The return hash contains a `role` field which refers to the Organization Invitation role and will be one of the following values: `direct_member`, `admin`, `billing_manager`, `hiring_manager`, or `reinstate`. If the invitee is not a GitHub member, the `login` field in the return hash will be `null`.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}/invitations`.
         */
        listPendingInvitationsInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["listPendingInvitationsInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["listPendingInvitationsInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the organization projects for a team.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}/projects`.
         */
        listProjectsInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["listProjectsInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["listProjectsInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists a team's repositories visible to the authenticated user.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `GET /organizations/{org_id}/team/{team_id}/repos`.
         */
        listReposInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["listReposInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["listReposInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * To remove a membership between a user and a team, the authenticated user must have 'admin' permissions to the team or be an owner of the organization that the team is associated with. Removing team membership does not delete the user, it just removes their membership from the team.
         *
         * Team synchronization is available for organizations using GitHub Enterprise Cloud. For more information, see [GitHub's products](https://docs.github.com/github/getting-started-with-github/githubs-products) in the GitHub Help documentation.
         *
         * **Note:** When you have team synchronization set up for a team with your organization's identity provider (IdP), you will see an error if you attempt to use the API for making changes to the team's membership. If you have access to manage group membership in your IdP, you can manage GitHub team membership through your identity provider, which automatically adds and removes team members in an organization. For more information, see "[Synchronizing teams between your identity provider and GitHub](https://docs.github.com/articles/synchronizing-teams-between-your-identity-provider-and-github/)."
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `DELETE /organizations/{org_id}/team/{team_id}/memberships/{username}`.
         */
        removeMembershipForUserInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["removeMembershipForUserInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["removeMembershipForUserInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes an organization project from a team. An organization owner or a team maintainer can remove any project from the team. To remove a project from a team as an organization member, the authenticated user must have `read` access to both the team and project, or `admin` access to the team or project. This endpoint removes the project from the team, but does not delete the project.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `DELETE /organizations/{org_id}/team/{team_id}/projects/{project_id}`.
         */
        removeProjectInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["removeProjectInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["removeProjectInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * If the authenticated user is an organization owner or a team maintainer, they can remove any repositories from the team. To remove a repository from a team as an organization member, the authenticated user must have admin access to the repository and must be able to see the team. This does not delete the repository, it just removes it from the team.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `DELETE /organizations/{org_id}/team/{team_id}/repos/{owner}/{repo}`.
         */
        removeRepoInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["removeRepoInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["removeRepoInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Edits the body text of a discussion comment. OAuth access tokens require the `write:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `PATCH /organizations/{org_id}/team/{team_id}/discussions/{discussion_number}/comments/{comment_number}`.
         */
        updateDiscussionCommentInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["updateDiscussionCommentInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["updateDiscussionCommentInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Edits the title and body text of a discussion post. Only the parameters you provide are updated. OAuth access tokens require the `write:discussion` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `PATCH /organizations/{org_id}/team/{team_id}/discussions/{discussion_number}`.
         */
        updateDiscussionInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["updateDiscussionInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["updateDiscussionInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * To edit a team, the authenticated user must either be an organization owner or a team maintainer.
         *
         * **Note:** You can also specify a team by `org_id` and `team_id` using the route `PATCH /organizations/{org_id}/team/{team_id}`.
         */
        updateInOrg: {
            (params?: RestEndpointMethodTypes["teams"]["updateInOrg"]["parameters"]): Promise<RestEndpointMethodTypes["teams"]["updateInOrg"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
    users: {
        /**
         * This endpoint is accessible with the `user` scope.
         * @deprecated octokit.rest.users.addEmailForAuthenticated() has been renamed to octokit.rest.users.addEmailForAuthenticatedUser() (2021-10-05)
         */
        addEmailForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["addEmailForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["addEmailForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This endpoint is accessible with the `user` scope.
         */
        addEmailForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["addEmailForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["addEmailForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Add one or more social accounts to the authenticated user's profile. This endpoint is accessible with the `user` scope.
         */
        addSocialAccountForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["addSocialAccountForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["addSocialAccountForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        block: {
            (params?: RestEndpointMethodTypes["users"]["block"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["block"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        checkBlocked: {
            (params?: RestEndpointMethodTypes["users"]["checkBlocked"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["checkBlocked"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        checkFollowingForUser: {
            (params?: RestEndpointMethodTypes["users"]["checkFollowingForUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["checkFollowingForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        checkPersonIsFollowedByAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["checkPersonIsFollowedByAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["checkPersonIsFollowedByAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Adds a GPG key to the authenticated user's GitHub account. Requires that you are authenticated via Basic Auth, or OAuth with at least `write:gpg_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         * @deprecated octokit.rest.users.createGpgKeyForAuthenticated() has been renamed to octokit.rest.users.createGpgKeyForAuthenticatedUser() (2021-10-05)
         */
        createGpgKeyForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["createGpgKeyForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["createGpgKeyForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Adds a GPG key to the authenticated user's GitHub account. Requires that you are authenticated via Basic Auth, or OAuth with at least `write:gpg_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         */
        createGpgKeyForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["createGpgKeyForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["createGpgKeyForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Adds a public SSH key to the authenticated user's GitHub account. Requires that you are authenticated via Basic Auth, or OAuth with at least `write:public_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         * @deprecated octokit.rest.users.createPublicSshKeyForAuthenticated() has been renamed to octokit.rest.users.createPublicSshKeyForAuthenticatedUser() (2021-10-05)
         */
        createPublicSshKeyForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["createPublicSshKeyForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["createPublicSshKeyForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Adds a public SSH key to the authenticated user's GitHub account. Requires that you are authenticated via Basic Auth, or OAuth with at least `write:public_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         */
        createPublicSshKeyForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["createPublicSshKeyForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["createPublicSshKeyForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Creates an SSH signing key for the authenticated user's GitHub account. You must authenticate with Basic Authentication, or you must authenticate with OAuth with at least `write:ssh_signing_key` scope. For more information, see "[Understanding scopes for OAuth apps](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)."
         */
        createSshSigningKeyForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["createSshSigningKeyForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["createSshSigningKeyForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This endpoint is accessible with the `user` scope.
         * @deprecated octokit.rest.users.deleteEmailForAuthenticated() has been renamed to octokit.rest.users.deleteEmailForAuthenticatedUser() (2021-10-05)
         */
        deleteEmailForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["deleteEmailForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["deleteEmailForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * This endpoint is accessible with the `user` scope.
         */
        deleteEmailForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["deleteEmailForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["deleteEmailForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a GPG key from the authenticated user's GitHub account. Requires that you are authenticated via Basic Auth or via OAuth with at least `admin:gpg_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         * @deprecated octokit.rest.users.deleteGpgKeyForAuthenticated() has been renamed to octokit.rest.users.deleteGpgKeyForAuthenticatedUser() (2021-10-05)
         */
        deleteGpgKeyForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["deleteGpgKeyForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["deleteGpgKeyForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a GPG key from the authenticated user's GitHub account. Requires that you are authenticated via Basic Auth or via OAuth with at least `admin:gpg_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         */
        deleteGpgKeyForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["deleteGpgKeyForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["deleteGpgKeyForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a public SSH key from the authenticated user's GitHub account. Requires that you are authenticated via Basic Auth or via OAuth with at least `admin:public_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         * @deprecated octokit.rest.users.deletePublicSshKeyForAuthenticated() has been renamed to octokit.rest.users.deletePublicSshKeyForAuthenticatedUser() (2021-10-05)
         */
        deletePublicSshKeyForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["deletePublicSshKeyForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["deletePublicSshKeyForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Removes a public SSH key from the authenticated user's GitHub account. Requires that you are authenticated via Basic Auth or via OAuth with at least `admin:public_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         */
        deletePublicSshKeyForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["deletePublicSshKeyForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["deletePublicSshKeyForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes one or more social accounts from the authenticated user's profile. This endpoint is accessible with the `user` scope.
         */
        deleteSocialAccountForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["deleteSocialAccountForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["deleteSocialAccountForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Deletes an SSH signing key from the authenticated user's GitHub account. You must authenticate with Basic Authentication, or you must authenticate with OAuth with at least `admin:ssh_signing_key` scope. For more information, see "[Understanding scopes for OAuth apps](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)."
         */
        deleteSshSigningKeyForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["deleteSshSigningKeyForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["deleteSshSigningKeyForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Note that you'll need to set `Content-Length` to zero when calling out to this endpoint. For more information, see "[HTTP verbs](https://docs.github.com/rest/overview/resources-in-the-rest-api#http-verbs)."
         *
         * Following a user requires the user to be logged in and authenticated with basic auth or OAuth with the `user:follow` scope.
         */
        follow: {
            (params?: RestEndpointMethodTypes["users"]["follow"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["follow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * If the authenticated user is authenticated with an OAuth token with the `user` scope, then the response lists public and private profile information.
         *
         * If the authenticated user is authenticated through OAuth without the `user` scope, then the response lists only public profile information.
         */
        getAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["getAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["getAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Provides publicly available information about someone with a GitHub account.
         *
         * GitHub Apps with the `Plan` user permission can use this endpoint to retrieve information about a user's GitHub plan. The GitHub App must be authenticated as a user. See "[Identifying and authorizing users for GitHub Apps](https://docs.github.com/apps/building-github-apps/identifying-and-authorizing-users-for-github-apps/)" for details about authentication. For an example response, see 'Response with GitHub plan information' below"
         *
         * The `email` key in the following response is the publicly visible email address from your GitHub [profile page](https://github.com/settings/profile). When setting up your profile, you can select a primary email address to be “public” which provides an email entry for this endpoint. If you do not set a public email address for `email`, then it will have a value of `null`. You only see publicly visible email addresses when authenticated with GitHub. For more information, see [Authentication](https://docs.github.com/rest/overview/resources-in-the-rest-api#authentication).
         *
         * The Emails API enables you to list all of your email addresses, and toggle a primary email to be visible publicly. For more information, see "[Emails API](https://docs.github.com/rest/reference/users#emails)".
         */
        getByUsername: {
            (params?: RestEndpointMethodTypes["users"]["getByUsername"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["getByUsername"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Provides hovercard information when authenticated through basic auth or OAuth with the `repo` scope. You can find out more about someone in relation to their pull requests, issues, repositories, and organizations.
         *
         * The `subject_type` and `subject_id` parameters provide context for the person's hovercard, which returns more information than without the parameters. For example, if you wanted to find out more about `octocat` who owns the `Spoon-Knife` repository via cURL, it would look like this:
         *
         * ```shell
         *  curl -u username:token
         *   https://api.github.com/users/octocat/hovercard?subject_type=repository&subject_id=1300192
         * ```
         */
        getContextForUser: {
            (params?: RestEndpointMethodTypes["users"]["getContextForUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["getContextForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * View extended details for a single GPG key. Requires that you are authenticated via Basic Auth or via OAuth with at least `read:gpg_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         * @deprecated octokit.rest.users.getGpgKeyForAuthenticated() has been renamed to octokit.rest.users.getGpgKeyForAuthenticatedUser() (2021-10-05)
         */
        getGpgKeyForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["getGpgKeyForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["getGpgKeyForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * View extended details for a single GPG key. Requires that you are authenticated via Basic Auth or via OAuth with at least `read:gpg_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         */
        getGpgKeyForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["getGpgKeyForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["getGpgKeyForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * View extended details for a single public SSH key. Requires that you are authenticated via Basic Auth or via OAuth with at least `read:public_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         * @deprecated octokit.rest.users.getPublicSshKeyForAuthenticated() has been renamed to octokit.rest.users.getPublicSshKeyForAuthenticatedUser() (2021-10-05)
         */
        getPublicSshKeyForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["getPublicSshKeyForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["getPublicSshKeyForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * View extended details for a single public SSH key. Requires that you are authenticated via Basic Auth or via OAuth with at least `read:public_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         */
        getPublicSshKeyForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["getPublicSshKeyForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["getPublicSshKeyForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Gets extended details for an SSH signing key. You must authenticate with Basic Authentication, or you must authenticate with OAuth with at least `read:ssh_signing_key` scope. For more information, see "[Understanding scopes for OAuth apps](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)."
         */
        getSshSigningKeyForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["getSshSigningKeyForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["getSshSigningKeyForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all users, in the order that they signed up on GitHub. This list includes personal user accounts and organization accounts.
         *
         * Note: Pagination is powered exclusively by the `since` parameter. Use the [Link header](https://docs.github.com/rest/guides/using-pagination-in-the-rest-api#using-link-headers) to get the URL for the next page of users.
         */
        list: {
            (params?: RestEndpointMethodTypes["users"]["list"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["list"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the users you've blocked on your personal account.
         * @deprecated octokit.rest.users.listBlockedByAuthenticated() has been renamed to octokit.rest.users.listBlockedByAuthenticatedUser() (2021-10-05)
         */
        listBlockedByAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["listBlockedByAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listBlockedByAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * List the users you've blocked on your personal account.
         */
        listBlockedByAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["listBlockedByAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listBlockedByAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all of your email addresses, and specifies which one is visible to the public. This endpoint is accessible with the `user:email` scope.
         * @deprecated octokit.rest.users.listEmailsForAuthenticated() has been renamed to octokit.rest.users.listEmailsForAuthenticatedUser() (2021-10-05)
         */
        listEmailsForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["listEmailsForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listEmailsForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all of your email addresses, and specifies which one is visible to the public. This endpoint is accessible with the `user:email` scope.
         */
        listEmailsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["listEmailsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listEmailsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the people who the authenticated user follows.
         * @deprecated octokit.rest.users.listFollowedByAuthenticated() has been renamed to octokit.rest.users.listFollowedByAuthenticatedUser() (2021-10-05)
         */
        listFollowedByAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["listFollowedByAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listFollowedByAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the people who the authenticated user follows.
         */
        listFollowedByAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["listFollowedByAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listFollowedByAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the people following the authenticated user.
         */
        listFollowersForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["listFollowersForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listFollowersForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the people following the specified user.
         */
        listFollowersForUser: {
            (params?: RestEndpointMethodTypes["users"]["listFollowersForUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listFollowersForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the people who the specified user follows.
         */
        listFollowingForUser: {
            (params?: RestEndpointMethodTypes["users"]["listFollowingForUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listFollowingForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the current user's GPG keys. Requires that you are authenticated via Basic Auth or via OAuth with at least `read:gpg_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         * @deprecated octokit.rest.users.listGpgKeysForAuthenticated() has been renamed to octokit.rest.users.listGpgKeysForAuthenticatedUser() (2021-10-05)
         */
        listGpgKeysForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["listGpgKeysForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listGpgKeysForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the current user's GPG keys. Requires that you are authenticated via Basic Auth or via OAuth with at least `read:gpg_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         */
        listGpgKeysForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["listGpgKeysForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listGpgKeysForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the GPG keys for a user. This information is accessible by anyone.
         */
        listGpgKeysForUser: {
            (params?: RestEndpointMethodTypes["users"]["listGpgKeysForUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listGpgKeysForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists your publicly visible email address, which you can set with the [Set primary email visibility for the authenticated user](https://docs.github.com/rest/reference/users#set-primary-email-visibility-for-the-authenticated-user) endpoint. This endpoint is accessible with the `user:email` scope.
         * @deprecated octokit.rest.users.listPublicEmailsForAuthenticated() has been renamed to octokit.rest.users.listPublicEmailsForAuthenticatedUser() (2021-10-05)
         */
        listPublicEmailsForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["listPublicEmailsForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listPublicEmailsForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists your publicly visible email address, which you can set with the [Set primary email visibility for the authenticated user](https://docs.github.com/rest/reference/users#set-primary-email-visibility-for-the-authenticated-user) endpoint. This endpoint is accessible with the `user:email` scope.
         */
        listPublicEmailsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["listPublicEmailsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listPublicEmailsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the _verified_ public SSH keys for a user. This is accessible by anyone.
         */
        listPublicKeysForUser: {
            (params?: RestEndpointMethodTypes["users"]["listPublicKeysForUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listPublicKeysForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the public SSH keys for the authenticated user's GitHub account. Requires that you are authenticated via Basic Auth or via OAuth with at least `read:public_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         * @deprecated octokit.rest.users.listPublicSshKeysForAuthenticated() has been renamed to octokit.rest.users.listPublicSshKeysForAuthenticatedUser() (2021-10-05)
         */
        listPublicSshKeysForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["listPublicSshKeysForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listPublicSshKeysForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the public SSH keys for the authenticated user's GitHub account. Requires that you are authenticated via Basic Auth or via OAuth with at least `read:public_key` [scope](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/).
         */
        listPublicSshKeysForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["listPublicSshKeysForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listPublicSshKeysForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists all of your social accounts.
         */
        listSocialAccountsForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["listSocialAccountsForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listSocialAccountsForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists social media accounts for a user. This endpoint is accessible by anyone.
         */
        listSocialAccountsForUser: {
            (params?: RestEndpointMethodTypes["users"]["listSocialAccountsForUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listSocialAccountsForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the SSH signing keys for the authenticated user's GitHub account. You must authenticate with Basic Authentication, or you must authenticate with OAuth with at least `read:ssh_signing_key` scope. For more information, see "[Understanding scopes for OAuth apps](https://docs.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/)."
         */
        listSshSigningKeysForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["listSshSigningKeysForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listSshSigningKeysForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Lists the SSH signing keys for a user. This operation is accessible by anyone.
         */
        listSshSigningKeysForUser: {
            (params?: RestEndpointMethodTypes["users"]["listSshSigningKeysForUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["listSshSigningKeysForUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sets the visibility for your primary email addresses.
         * @deprecated octokit.rest.users.setPrimaryEmailVisibilityForAuthenticated() has been renamed to octokit.rest.users.setPrimaryEmailVisibilityForAuthenticatedUser() (2021-10-05)
         */
        setPrimaryEmailVisibilityForAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["setPrimaryEmailVisibilityForAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["setPrimaryEmailVisibilityForAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Sets the visibility for your primary email addresses.
         */
        setPrimaryEmailVisibilityForAuthenticatedUser: {
            (params?: RestEndpointMethodTypes["users"]["setPrimaryEmailVisibilityForAuthenticatedUser"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["setPrimaryEmailVisibilityForAuthenticatedUser"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        unblock: {
            (params?: RestEndpointMethodTypes["users"]["unblock"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["unblock"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * Unfollowing a user requires the user to be logged in and authenticated with basic auth or OAuth with the `user:follow` scope.
         */
        unfollow: {
            (params?: RestEndpointMethodTypes["users"]["unfollow"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["unfollow"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
        /**
         * **Note:** If your email is set to private and you send an `email` parameter as part of this request to update your profile, your privacy settings are still enforced: the email address will not be displayed on your public profile or via the API.
         */
        updateAuthenticated: {
            (params?: RestEndpointMethodTypes["users"]["updateAuthenticated"]["parameters"]): Promise<RestEndpointMethodTypes["users"]["updateAuthenticated"]["response"]>;
            defaults: RequestInterface["defaults"];
            endpoint: EndpointInterface<{
                url: string;
            }>;
        };
    };
};
