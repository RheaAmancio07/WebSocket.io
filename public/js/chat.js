(function ($) {



	// window.location.origin polyfill support for IE
	if (!window.location.origin) { window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : ''); }

	var socket = io.connect(window.location.origin);

	var chatNameSection = $('.chat-name-section'),
		chatBoxSection = $('.chat-box-section'),
		chatInputSection = $('.chat-input-section'),
		chatSound = new Howl({
			urls: ['/other/notify.ogg', '/other/notify.mp3', '/other/notify.wav']
		});

	var chatNameForm = $('#chatNameForm'),
		chatInputForm = $('#chatInputForm');

	var chatBox = $('#chatBox'),
		chatTextBox = $('#chatTextBox'),
		usersBox = $('#usersBox');

	var modalPopupBtn = $('#usersOnlineBtn'),
		usersOnlineCounter = modalPopupBtn.find('.badge');

	var sentBtn = $('#chatSendBtn')


	/**
	 * Socket Events
	 */

	// If name already exists
	socket.on('nickname taken', function () {
		chatNameSection.find('.form-group').addClass('has-error has-nickname-taken');
	});

	// Welcoming signed in user
	let name;
	socket.on('welcome', function (nickname, nicknames) {
		name = nickname;
		$('.loggedIn').addClass('d-block').removeClass('d-none')
		// Show Chat Area
		chatNameSection.remove();
		chatBoxSection.show(500);
		chatInputSection.show(500);

		chatBoxSection.find('#user').html('Hello, <span class="text-success">' + nickname + '</span>');

		$('.userName').html(name);
		// Update users list
		updateUsers(nicknames);
	});

	// Broadcast to rest of chat that user has joined
	socket.on('user joined', function (nickname, nicknames) {
		var userJoinedMessage = '<p class="text-primary text-center"><em><u>' + nickname + '</u> has joined the chat.</em></p>';

		// Append to chat box and scroll to latest message
		appendAndScroll(userJoinedMessage);

		// Update users list
		updateUsers(nicknames);
	});

	// Broadcast to rest of chat that user has left
	socket.on('user left', function (nickname, nicknames) {
		var userLeftMessage = '<p class="text-warning text-center"><em>' + nickname + ' has left the chat.</em></p>';

		// Append to chat box and scroll to latest message
		appendAndScroll(userLeftMessage);

		// Update users list
		updateUsers(nicknames);
	});

	// Display incoming messages on screen
	socket.on('incoming', function (data, self) {

		var nickname = self ? 'You' : data.nickname;
		var self = self ? 'self' : '';
		var receivedMessage = '<p class="entry ' + self + '"><b class="text-light">' + nickname + ' said: </b>' + data.message + '</p>';

		// Append to chat box and scroll to latest message
		appendAndScroll(receivedMessage);
		

	});

	/**
	 * UI Events
	 */

	// Submit handler for name entry box
	chatNameForm.on('submit', function (e) {

		e.preventDefault();

		var chatName = $.trim(chatNameSection.find('#name').val());

		if (chatName != '') {
			// Emit valid entry to server
			// for validation against nicknames array
			socket.emit('new user', { nickname: sanitize(chatName) });
			$('.chika').addClass('d-none')
		} else {
			chatNameSection.find('.form-group').addClass('has-error');
		}
	});
	// when the user type something then send it to the server
	chatTextBox.keyup(() => {
		socket.emit("typing", {
			typing: chatTextBox.val().length > 0,
			username: name
		})
	})

	// then this is to display whatever the server send.
	socket.on("typing", (data) => {
		$('.typing').html(data.typing ? `${data.username} is typing..` : '')

	})

	sentBtn.click(() => {

		socket.emit('stop-typing', {
			typing: chatTextBox.val().length == 0,
			username: name
		})
	})
	socket.on("stop-typing", (data) => {
		$('.typing').html("")

	})

	// Submit handler for message entry box
	chatInputForm.on('submit', function (e) {
		e.preventDefault();
		validateAndSend();
	});

	// Trigger submit handler for message box programatically
	// when 'Enter' key is pressed. Does not match when
	// the Shift, Ctrl or Alt key are also pressed during that process
	chatTextBox.on('keypress', function (e) {
		if (e.which === 13 && e.shiftKey === false &&
			e.altKey === false && e.ctrlKey === false &&

			// Ensuring its not a touch device as
			// you wouldn't want this event attached in that scenario
			('ontouchstart' in window === false || 'msMaxTouchPoints' in window.navigator === false)) {

			// submit form
			chatInputForm.submit();
			return false; // prevent cursor from shifting to next line
		}
	});

	// Remove error when input is being typed in
	chatNameSection.find('#name').on('keypress', function (e) {
		chatNameSection.find('.has-error').removeClass('has-error').removeClass('has-nickname-taken');
	});

	// Modal Popup - as part of Bootstrap Javascript components
	// modalPopupBtn.on('click', function(e) {
	// 	usersBox.modal('show');
	// });



	/**
	 * Helper functions
	 */

	// Convert html tags into literal strings
	function sanitize(input) {
		var input = input.replace(/>/g, '&gt;').replace(/</g, '&lt;').replace('\n', '<br/>');
		return input;
	}

	// Appends messages to chat box and scroll down
	// to latest notification
	function appendAndScroll(html) {
		chatBox.append(html);
		chatBox.scrollTop(chatBox[0].scrollHeight);

		// Plays sound if its not already playing
		chatSound.play();
	}

	// Validate and send messages
	function validateAndSend() {
		var chatMessage = $.trim(chatTextBox.val());

		if (chatMessage != '') {
			socket.emit('outgoing', { message: sanitize(chatMessage) });

			// Clear chat text box after message success
			chatTextBox.val('');
		}
	};

	// Populate/Update users list
	function updateUsers(nicknames) {

		var users = '<ul class="list-group">';

		for (var i = 0; i < nicknames.length; i++) {

			users += '<li class="list-group-item bg-transparent border-0 text-white"><img style="width:40px;" src="https://i.pinimg.com/736x/2d/1c/c2/2d1cc2c80acb545d5b7995ae7ba4443f.jpg" alt="">' + nicknames[i] + '</li>';
		}

		users += '</ul>';

		// Update users box
		// usersBox.find('.modal-body').html(users);
		$('.online-users').html(users);

		// Update 'Users Online' counter
		usersOnlineCounter.text(nicknames.length);
	}


})(jQuery);