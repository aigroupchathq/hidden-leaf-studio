(function () {
    'use strict';

    let account = null;
    let authMode = 'login';
    let currentUser = null;

    function getConfig() {
        const config = window.HIDDEN_LEAF_APPWRITE_CONFIG;
        if (!config || typeof config.endpoint !== 'string' || typeof config.projectId !== 'string') {
            return null;
        }

        const endpoint = config.endpoint.trim();
        const projectId = config.projectId.trim();
        if (!endpoint || !projectId) return null;

        let parsedEndpoint;
        try {
            parsedEndpoint = new URL(endpoint);
        } catch (error) {
            return null;
        }

        const isLocalHttp = parsedEndpoint.protocol === 'http:' &&
            (parsedEndpoint.hostname === 'localhost' || parsedEndpoint.hostname === '127.0.0.1');
        if (parsedEndpoint.protocol !== 'https:' && !isLocalHttp) return null;

        return { endpoint: endpoint.replace(/\/+$/, ''), projectId };
    }

    function setAuthStatus(message, isError) {
        const status = document.getElementById('appwrite-account-status');
        if (!status) return;
        status.textContent = message;
        status.classList.toggle('text-red-300', Boolean(isError));
        status.classList.toggle('text-zinc-300', !isError);
    }

    function updateAccountUI() {
        const badge = document.getElementById('appwrite-auth-badge');
        const signOutButton = document.getElementById('appwrite-sign-out');
        if (!badge || !signOutButton) return;

        if (currentUser) {
            badge.textContent = 'Signed in · ' + (currentUser.name || currentUser.email);
            badge.title = currentUser.email;
            signOutButton.classList.remove('hidden');
            return;
        }

        const config = getConfig();
        badge.textContent = !window.Appwrite
            ? 'Appwrite · SDK unavailable'
            : config
                ? 'Appwrite · signed out'
                : 'Appwrite · setup required';
        badge.removeAttribute('title');
        signOutButton.classList.add('hidden');
    }

    function setAppwriteAuthMode(mode) {
        authMode = mode === 'signup' ? 'signup' : 'login';
        const isSignUp = authMode === 'signup';
        const nameLabel = document.getElementById('appwrite-name-label');
        const nameInput = document.getElementById('appwrite-name');
        nameLabel.style.display = isSignUp ? 'block' : 'none';
        nameInput.style.display = isSignUp ? 'block' : 'none';
        nameInput.required = isSignUp;
        document.getElementById('appwrite-password').autocomplete = isSignUp ? 'new-password' : 'current-password';
        document.getElementById('appwrite-submit').textContent = isSignUp ? 'Create account' : 'Sign in';
        document.getElementById('appwrite-login-mode').setAttribute('aria-pressed', String(!isSignUp));
        document.getElementById('appwrite-signup-mode').setAttribute('aria-pressed', String(isSignUp));
        document.getElementById('appwrite-login-mode').classList.toggle('border-leaf-moss', !isSignUp);
        document.getElementById('appwrite-login-mode').classList.toggle('border-leaf-line', isSignUp);
        document.getElementById('appwrite-signup-mode').classList.toggle('border-leaf-moss', isSignUp);
        document.getElementById('appwrite-signup-mode').classList.toggle('border-leaf-line', !isSignUp);
    }

    function initializeAccount() {
        const config = getConfig();
        if (!window.Appwrite) {
            setAuthStatus('The Appwrite SDK did not load. Check your connection and reload this page.', true);
            updateAccountUI();
            return;
        }
        if (!config) {
            setAuthStatus('Not connected yet. Add the Appwrite Web SDK endpoint in appwrite-config.js and verify the project ID in Appwrite Console. Allow this site hostname as a Web platform. Never add an API key here.', false);
            updateAccountUI();
            return;
        }

        const client = new window.Appwrite.Client()
            .setEndpoint(config.endpoint)
            .setProject(config.projectId);
        account = new window.Appwrite.Account(client);
        refreshAppwriteAccount();
    }

    async function refreshAppwriteAccount() {
        if (!account) return;
        try {
            currentUser = await account.get();
            setAuthStatus(
                'Signed in as ' + (currentUser.name || currentUser.email) +
                '. Authentication is connected; collaboration data remains local until its tables and permissions are configured.',
                false
            );
        } catch (error) {
            if (error && error.code === 401) {
                currentUser = null;
                setAuthStatus('Appwrite is configured. Sign in or create an account to continue.', false);
            } else {
                currentUser = null;
                console.error('Could not check the Appwrite account session.', error);
                setAuthStatus('Could not reach Appwrite (' + (error && error.message ? error.message : 'unknown error') + '). Check the endpoint, project Web platform, and network, then try again.', true);
            }
        }
        updateAccountUI();
    }

    async function submitAppwriteAccount(event) {
        event.preventDefault();
        if (!account) {
            setAuthStatus('Appwrite is not ready. Configure appwrite-config.js and reload the page.', true);
            return;
        }

        const submitButton = document.getElementById('appwrite-submit');
        const form = document.getElementById('appwrite-account-form');
        submitButton.disabled = true;
        try {
            const email = document.getElementById('appwrite-email').value.trim();
            const password = document.getElementById('appwrite-password').value;
            if (authMode === 'signup') {
                const name = document.getElementById('appwrite-name').value.trim();
                await account.create({
                    userId: window.Appwrite.ID.unique(),
                    email,
                    password,
                    name
                });
            }

            await account.createEmailPasswordSession({ email, password });
            await refreshAppwriteAccount();
            if (!currentUser) return;
            form.reset();
            setAppwriteAuthMode('login');
            document.getElementById('appwrite-account-dialog').close();
        } catch (error) {
            console.error('Appwrite account action failed.', error);
            const message = error && error.message ? error.message : 'Unknown Appwrite error.';
            setAuthStatus(
                authMode === 'signup'
                    ? 'Account creation or sign-in failed: ' + message
                    : 'Sign-in failed: ' + message,
                true
            );
        } finally {
            submitButton.disabled = false;
        }
    }

    async function signOutAppwrite() {
        if (!account) return;
        try {
            await account.deleteSession({ sessionId: 'current' });
            currentUser = null;
            updateAccountUI();
            setAuthStatus('Signed out of Appwrite. Local preview rooms are unchanged.', false);
        } catch (error) {
            console.error('Appwrite sign-out failed.', error);
            setAuthStatus('Could not sign out: ' + (error && error.message ? error.message : 'Unknown Appwrite error.'), true);
        }
    }

    function openAppwriteAccountDialog() {
        const dialog = document.getElementById('appwrite-account-dialog');
        setAppwriteAuthMode('login');
        dialog.showModal();
        initializeAccount();
    }

    window.openAppwriteAccountDialog = openAppwriteAccountDialog;
    window.setAppwriteAuthMode = setAppwriteAuthMode;
    window.submitAppwriteAccount = submitAppwriteAccount;
    window.signOutAppwrite = signOutAppwrite;

    initializeAccount();
})();
