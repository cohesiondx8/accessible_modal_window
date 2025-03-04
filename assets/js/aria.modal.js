// https://github.com/cohesiondx8/accessible_modal_window - forked to here
;(function (w, doc, undefined) {
    'use strict';
    var ARIAmodal = {};
    w.ARIAmodal = ARIAmodal;
    ARIAmodal.NS = 'ARIAmodal';
    ARIAmodal.AUTHOR = 'Scott O\'Hara';
    ARIAmodal.VERSION = '3.4.0';
    ARIAmodal.LICENSE = 'https://github.com/scottaohara/accessible_modal_window/blob/master/LICENSE';
    var activeClass = 'modal-open';
    var body = doc.body;
    var main = doc.getElementsByTagName('main')[0] || body;
    var modal = doc.querySelectorAll('[data-modal]');
    var children = doc.querySelectorAll('body > *:not([data-modal])');
    var initialTrigger;
    var activeModal;
    var useAriaModal = false;
    var returnToBody = false;
    var firstClass = 'js-first-focus';
    var lastClass = 'js-last-focus';
    var tabFocusElements = 'button:not([hidden]):not([disabled]), [href]:not([hidden]), input:not([hidden]):not([type="hidden"]):not([disabled]), select:not([hidden]):not([disabled]), textarea:not([hidden]):not([disabled]), [tabindex="0"]:not([hidden]):not([disabled]), summary:not([hidden]), [contenteditable]:not([hidden]), audio[controls]:not([hidden]), video[controls]:not([hidden])';
    ARIAmodal.organizeDOM = function () {
        var refEl = body.firstElementChild || null;
        var i;
        for (i = 0; i < modal.length; i += 1) {
            body.insertBefore(modal[i], refEl)
        }
    };
    ARIAmodal.setupTrigger = function () {
        var trigger = doc.querySelectorAll('[data-modal-open]');
        var self;
        var i;
        for (i = 0; i < trigger.length; i += 1) {
            self = trigger[i];
            var getOpenTarget = self.getAttribute('data-modal-open');
            var hasHref = self.getAttribute('href');
            if (self.nodeName !== 'BUTTON') {
                self.setAttribute('role', 'button');
                self.tabIndex = 0
            }
            if (getOpenTarget === '' && hasHref) {
                self.setAttribute('data-modal-open', hasHref.split('#')[1]);
                getOpenTarget = hasHref.split('#')[1]
            }
            self.removeAttribute('href');
            if (getOpenTarget) {
                if (self.hasAttribute('disabled') && !self.hasAttribute('data-modal-disabled')) {
                    self.removeAttribute('disabled')
                }
                self.removeAttribute('hidden');
                self.addEventListener('click', ARIAmodal.openModal);
                self.addEventListener('keydown', ARIAmodal.keyEvents, false)
            } else {
                console.warn('Missing target modal dialog - [data-modal-open="IDREF"]')
            }
        }
    };
    ARIAmodal.setupModal = function () {
        var self;
        var i;
        for (i = 0; i < modal.length; i += 1) {
            var self = modal[i];
            var modalType = self.getAttribute('data-modal');
            var getClass = self.getAttribute('data-modal-class') || 'a11y-modal';
            var heading = self.querySelector('h1, h2, h3, h4, h5, h6');
            var modalLabel = self.getAttribute('data-modal-label');
            var hideHeading = self.hasAttribute('data-modal-hide-heading');
            var modalDesc = self.querySelector('[data-modal-description]');
            var modalDoc = self.querySelector('[data-modal-document]');
            if (modalType === 'alert') {
                self.setAttribute('role', 'alertdialog')
            } else {
                self.setAttribute('role', 'dialog')
            }
            self.classList.add(getClass);
            self.hidden = true;
            self.tabIndex = '-1';
            if (modalDoc) {
                modalDoc.setAttribute('role', 'document')
            }
            ARIAmodal.setupModalCloseBtn(self, getClass, modalType);
            if (self.hasAttribute('data-aria-modal')) {
                self.setAttribute('aria-modal', 'true')
            }
            if (modalDesc) {
                modalDesc.id = modalDesc.id || 'md_desc_' + Math.floor(Math.random() * 999) + 1;
                self.setAttribute('aria-describedby', modalDesc.id)
            }
            if (modalLabel) {
                self.setAttribute('aria-label', modalLabel)
            } else {
                if (heading) {
                    var makeHeading = self.id + '_heading';
                    heading.classList.add(getClass + '__heading');
                    heading.id = makeHeading;
                    self.setAttribute('aria-labelledby', makeHeading);
                    if (heading.hasAttribute('data-autofocus')) {
                        heading.tabIndex = '-1'
                    }
                } else {
                    console.warn('Dialogs should have their purpose conveyed by a heading element (h1).')
                }
            }
            if (hideHeading) {
                self.querySelector('#' + heading.id).classList.add('at-only')
            }
            var focusable = self.querySelectorAll(tabFocusElements);
            focusable[0].classList.add(firstClass);
            focusable[focusable.length - 1].classList.add(lastClass)
        }
    };
    ARIAmodal.setupModalCloseBtn = function (self, modalClass, modalType) {
        var doNotGenerate = self.hasAttribute('data-modal-manual-close');
        var manualClose = self.querySelectorAll('[data-modal-close-btn]');
        var modalClose = self.getAttribute('data-modal-close');
        var modalCloseClass = self.getAttribute('data-modal-close-class');
        var closeIcon = '<span data-modal-x></span>';
        var btnClass = modalClass;
        var i;
        if (!doNotGenerate) {
            if (manualClose.length < 2) {
                var closeBtn = doc.createElement('button');
                closeBtn.type = 'button';
                self.classList.add(modalClass);
                closeBtn.classList.add(modalClass + '__close-btn');
                if (!modalClose && modalType !== 'alert') {
                    closeBtn.innerHTML = closeIcon;
                    closeBtn.setAttribute('aria-label', 'Close');
                    closeBtn.classList.add('is-icon-btn')
                } else {
                    closeBtn.innerHTML = modalClose;
                    if (modalCloseClass) {
                        closeBtn.classList.add(modalCloseClass)
                    }
                }
                if (modalType !== 'alert') {
                    if (self.querySelector('[role="document"]')) {
                        self.querySelector('[role="document"]').appendChild(closeBtn)
                    } else {
                        self.appendChild(closeBtn)
                    }
                }
                closeBtn.addEventListener('click', ARIAmodal.closeModal)
            }
        }
        for (i = 0; i < manualClose.length; i += 1) {
            manualClose[i].addEventListener('click', ARIAmodal.closeModal)
        }
        doc.addEventListener('keydown', ARIAmodal.keyEvents, false)
    };
    ARIAmodal.openModal = function (e, autoOpen) {
        var i;
        var getTargetModal = autoOpen || this.getAttribute('data-modal-open');
        activeModal = doc.getElementById(getTargetModal);
        var focusTarget = activeModal;
        var getAutofocus = activeModal.querySelector('[autofocus]') || activeModal.querySelector('[data-autofocus]');
        var setInert = activeModal.hasAttribute('data-coh-modal-overlay');
        useAriaModal = activeModal.hasAttribute('aria-modal');
        if (autoOpen) {
            returnToBody = true
        }
        if (!autoOpen) {
            e.preventDefault();
            initialTrigger = this.id
        }
        if (getAutofocus) {
            focusTarget = getAutofocus
        } else if (activeModal.hasAttribute('data-modal-close-focus')) {
            focusTarget = activeModal.querySelector('[class*="close-btn"]')
        }
        if (!body.classList.contains(activeClass)) {
            body.classList.add(activeClass);

            if(setInert) {
                for (i = 0; i < children.length; i += 1) {
                    if (!useAriaModal) {
                        if (children[i].hasAttribute('aria-hidden')) {
                            children[i].setAttribute('data-keep-hidden', children[i].getAttribute('aria-hidden'))
                        }
                        children[i].setAttribute('aria-hidden', 'true')
                    }
                    if (children[i].getAttribute('inert')) {
                        children[i].setAttribute('data-keep-inert', '')
                    } else {
                        children[i].setAttribute('inert', 'true')
                    }
                }
            }
        } else {
            console.warn('It is not advised to open dialogs from within other dialogs. Instead consider replacing the contents of this dialog with new content. Or providing a stepped, or tabbed interface within this dialog.')
        }
        activeModal.removeAttribute('hidden');
        requestAnimationFrame(function () {
            focusTarget.focus()
        });

        return [initialTrigger, activeModal, returnToBody]
    };
    ARIAmodal.closeModal = function (e) {
        var trigger = doc.getElementById(initialTrigger) || null;
        var i;
        var m;
        for (i = 0; i < children.length; i += 1) {
            if (!children[i].hasAttribute('data-keep-inert')) {
                children[i].removeAttribute('inert')
            }
            children[i].removeAttribute('data-keep-inert');
            if (children[i].getAttribute('data-keep-hidden')) {
                children[i].setAttribute('aria-hidden', children[i].getAttribute('data-keep-hidden'))
            } else {
                children[i].removeAttribute('aria-hidden')
            }
            children[i].removeAttribute('data-keep-hidden')
        }
        body.classList.remove(activeClass);
        for (m = 0; m < modal.length; m += 1) {
            if (!modal[m].hasAttribute('hidden')) {
                modal[m].hidden = true
            }
        }
        if (trigger !== null) {
            trigger.focus()
        } else {
            if (main && !returnToBody) {
                main.tabIndex = -1;
                main.focus()
            } else {
                body.tabIndex = -1;
                body.focus()
            }
        }
        initialTrigger = undefined;
        activeModal = undefined;
        returnToBody = false;
        return [initialTrigger, activeModal, returnToBody]
    };
    ARIAmodal.keyEvents = function (e) {
        var keyCode = e.keyCode || e.which;
        var escKey = 27;
        var enterKey = 13;
        var spaceKey = 32;
        var tabKey = 9;
        if (e.target.hasAttribute('data-modal-open')) {
            switch (keyCode) {
                case enterKey:
                case spaceKey:
                    e.preventDefault();
                    e.target.click();
                    break
            }
        }
        if (body.classList.contains(activeClass)) {
            switch (keyCode) {
                case escKey:
                    ARIAmodal.closeModal();
                    break;
                default:
                    break
            }
            if (body.classList.contains(activeClass)) {
                var firstFocus = activeModal.querySelector('.' + firstClass);
                var lastFocus = activeModal.querySelector('.' + lastClass)
            }
            if (doc.activeElement.classList.contains(lastClass)) {
                if (keyCode === tabKey && !e.shiftKey) {
                    e.preventDefault();
                    firstFocus.focus()
                }
            }
            if (doc.activeElement.classList.contains(firstClass)) {
                if (keyCode === tabKey && e.shiftKey) {
                    e.preventDefault();
                    lastFocus.focus()
                }
            }
        }
    };

    ARIAmodal.autoLoad = function () {
        var getAuto = doc.querySelectorAll('[data-modal-auto]');
        var hashValue = w.location.hash || null;
        var autoOpen;
        var useHash = false;
        var e = null;
        if (hashValue !== null) {
            autoOpen = hashValue.split('#')[1];
            if (autoOpen === '') {
                return false
            } else if (autoOpen === '!null') {
                return false
            } else {
                var checkforDialog = doc.getElementById(autoOpen) || null;
                if (checkforDialog !== null) {
                    if (checkforDialog.getAttribute('role') === 'dialog' || checkforDialog.getAttribute('role') === 'alertdialog') {
                        useHash = true
                    }
                }
            }
        }
        if (useHash) {
            ARIAmodal.openModal(e, autoOpen);
            if (getAuto.length > 1) {
                console.warn('Only the modal indicated by the hash value will load.')
            }
        } else if (getAuto.length !== 0) {
            if (getAuto[0].getAttribute('role') === 'dialog' || getAuto[0].getAttribute('role') === 'alertdialog') {
                autoOpen = getAuto[0].id;
                ARIAmodal.openModal(e, autoOpen);
                if (getAuto.length > 1) {
                    console.warn('Multiple modal dialogs can not auto load.')
                }
            } else if (getAuto[0].getAttribute('role') === 'button' || getAuto[0].tagName === 'BUTTON') {
                autoOpen = getAuto[0].id;
                getAuto[0].click()
            }
        }
        if (getAuto.length !== 0 && !doc.getElementById(autoOpen).hasAttribute('data-modal-auto-persist')) {
            w.location.replace("#!null")
        }
    };
    ARIAmodal.init = function () {
        ARIAmodal.organizeDOM();
        ARIAmodal.setupTrigger();
        ARIAmodal.setupModal();
        ARIAmodal.autoLoad()
    };
    ARIAmodal.init()
})(window, document);
