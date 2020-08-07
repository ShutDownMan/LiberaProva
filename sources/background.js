
(function() {

	// create alarm for watchdog and fresh on installed/updated, and start fetch data
	chrome.runtime.onInstalled.addListener(() => {
		console.log('onInstalled....');
		scheduleRequest();
		scheduleWatchdog();
		checkCursosUpdated();
	});

	// fetch and save data when chrome restarted, alarm will continue running when chrome is restarted
	chrome.runtime.onStartup.addListener(() => {
		console.log('onStartup....');
		checkCursosUpdated();
	});

	// alarm listener
	chrome.alarms.onAlarm.addListener(alarm => {
		// if watchdog is triggered, check whether refresh alarm is there
		if (alarm && alarm.name === 'watchdog') {
			chrome.alarms.get('refresh', (alarm) => {
				if (alarm) {
					console.log('Refresh alarm exists. Yay.');
				} else {
					// if it is not there, start a new request and reschedule refresh alarm
					console.log("Refresh alarm doesn't exist, starting a new one");
					checkCursosUpdated();
					scheduleRequest();
				}
			});
		} else {
			// if refresh alarm triggered, start a new request
			checkCursosUpdated();
		}
	});

	// schedule a new fetch every 30 minutes
	function scheduleRequest() {
		console.log('schedule refresh alarm to 30 minutes...');
		chrome.alarms.create('refresh', { periodInMinutes: 30 });
	}

	// schedule a watchdog check every 5 minutes
	function scheduleWatchdog() {
		console.log('schedule watchdog alarm to 5 minutes...');
		chrome.alarms.create('watchdog', { periodInMinutes: 5 });
	}

	// fetch data and save to local storage
	async function startRequest() {
		const data = await fetchRepositories();
		saveToLocalStorage(data);
	}

	async function checkCursosUpdated() {
		// get if updated cursos.json
		let isOutOfDate = await updateCursos();

		if(!isOutOfDate.status) return;

		console.log('update and save');

		/// save updated cursos.json to local storage
		updatedCursos = await getUpdatedCursos();
		chrome.storage.local.set({cursos: updatedCursos}, function() {
			console.log(updatedCursos);
			console.log('updated cursos.json is now saved on local storage');
		});

		/// update last modified date
		chrome.storage.local.set({lastmodified: isOutOfDate.lastmodified}, function() {
			console.log('last modified date for cursos.json is now ' + isOutOfDate.lastmodified);
		});
	}

	async function updateCursos() {
		console.log('start HTTP Request...');

		let isOutOfDate = undefined;
		let lastModified = await new Promise((resolve, reject) => {
			chrome.storage.local.get(['lastmodified'], function(result) {
				resolve(result.lastmodified);
			});
		});

		let url = "https://p4f4yiv2l0.execute-api.sa-east-1.amazonaws.com/prod/cursos";
		let body = {lastmodified: lastModified};
		console.log(body);
		const options = {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json'
			}
		};

		return fetch(url, options)
		.then((response) => response.json())
		.then((response) => {
			console.log(response);

			isOutOfDate = response;
			isOutOfDate.status = (isOutOfDate.filestatus === "out of date");

			return isOutOfDate;
		}).catch(() => {
			console.log(response)
			console.log("Error on out of date fetch");
		});
	}

	async function getUpdatedCursos() {
		console.log('start HTTP Request...');
		let updatedCursos = undefined;

		let url = "https://p4f4yiv2l0.execute-api.sa-east-1.amazonaws.com/prod/cursos";

		return fetch(url)
		.then((response) => response.json())
		.then((response) => {
			// console.log(response);

			updatedCursos = response;

			return updatedCursos;
		}).catch(() => {
			console.log(response)
			console.log("Error on cursos fetch");
		});
	}

})();
