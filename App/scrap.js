const btn_linkedin = document.querySelector(".btn_linkedin");
console.log({ btn_linkedin });

btn_linkedin.addEventListener("click", async () => {
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

	chrome.scripting.executeScript({
		target: { tabId: tab.id },
		function: scrapingProfile,
	});
});

const scrapingProfile = async () => {
	const wait = (milliseconds) => {
		return new Promise(function (resolve) {
			setTimeout(function () {
				resolve();
			}, milliseconds);
		});
	};

	const autoscrollToElement = async (selector) => {
		let exists = document.querySelector(selector);

		while (exists) {
			let maxScrollTop = document.body.clientHeight - window.innerHeight;
			let elementScrollTop = document.querySelector(selector).offsetHeight;
			let currentScrollTop = window.scrollY;

			if (
				maxScrollTop == currentScrollTop ||
				elementScrollTop <= currentScrollTop
			)
				break;

			await wait(32);

			let newScrollTop = Math.min(currentScrollTop + 20, maxScrollTop);
			window.scrollTo(0, newScrollTop);
		}

		return new Promise((resolve) => resolve());
	};

	const selectorProfile = {
		personalInformation: {
			name: "#ember41 > div.ph5.pb5 > div.mt2.relative > div:nth-child(1) > div:nth-child(1) > h1",
			resume:
				"#ember41 > div.ph5.pb5 > div.mt2.relative > div:nth-child(1) > div.text-body-medium.break-words",
		},
		experienceInformation: {
			list: "#experience-section > ul > li",
			groupByCompany: {
				identify: ".pv-entity__position-group",
				company: "div.pv-entity__company-summary-info > h3 > span:nth-child(2)",
				list: "section > ul > li",
				title: "div > div > div > div > div > div > h3 > span:nth-child(2)",
				date: "div > div > div > div > div > div > div > h4 > span:nth-child(2)",
				description: ".pv-entity__description",
			},
			default: {
				title: "section > div > div > a > div.pv-entity__summary-info > h3",
				company:
					"section > div > div > a > div.pv-entity__summary-info > p.pv-entity__secondary-title",
				date: "section > div > div > a > div.pv-entity__summary-info > div > h4.pv-entity__date-range > span:nth-child(2)",
				description: "section > div > div > div > p",
			},
		},
		educationInformation: {
			list: "#education-section > ul > li",
			institution: "div > div > a > div.pv-entity__summary-info > div > h3",
			career:
				"div > div > a > div.pv-entity__summary-info > div > p > span:nth-child(2)",
			date: "div > div > a > div.pv-entity__summary-info > p > span:nth-child(2)",
		},
	};

	const clickOnMoreResume = async () => {
		const elementMoreResume = document.getElementById(
			"line-clamp-show-more-button"
		);
		if (elementMoreResume) elementMoreResume.click();
	};

	const getPersonalInformation = async () => {
		const { personalInformation: selector } = selectorProfile;
		const elementNameProfile = document.querySelector(selector.name);
		const elementResume = document.querySelector(selector.resume);

		const name = elementNameProfile?.innerText;
		const resume = elementResume?.innerText;
		return { name, resume };
	};

	const getExperienceInformation = async () => {
		const { experienceInformation: selector } = selectorProfile;
		let experiencesRawList = document.querySelectorAll(selector.list);
		let experiencesRawArray = Array.from(experiencesRawList);

		const groupCompaniesList = experiencesRawArray.filter((el) => {
			let groupCompanyExperience = el.querySelectorAll(
				selector.groupByCompany.identify
			);
			return groupCompanyExperience.length > 0;
		});

		const uniqueExperienceList = experiencesRawArray.filter((el) => {
			let groupCompanyExperience = el.querySelectorAll(
				selector.groupByCompany.identify
			);
			return groupCompanyExperience.length == 0;
		});

		const experiences = uniqueExperienceList.map((el) => {
			const title = el.querySelector(selector.default.title)?.innerText;
			const date = el.querySelector(selector.default.date)?.innerText;
			const company = el.querySelector(selector.default.company)?.innerText;
			const description = el.querySelector(
				selector.default.description
			)?.innerText;

			return { title, date, company, description };
		});

		for (let i = 0; i < groupCompaniesList.length; i++) {
			const item = groupCompaniesList[i];
			const company = item.querySelector(
				selector.groupByCompany.company
			)?.innerText;
			const itemsCompanyGroupList = item.querySelectorAll(
				selector.groupByCompany.list
			);
			const itemsCompanyGroupArray = Array.from(itemsCompanyGroupList);

			const experiencesData = itemsCompanyGroupArray.map((el) => {
				const title = el.querySelector(
					selector.groupByCompany.title
				)?.innerText;
				const date = el.querySelector(selector.groupByCompany.date)?.innerText;
				const description = el.querySelector(
					selector.groupByCompany.description
				)?.innerText;

				return { title, date, company, description };
			});

			experiences.push(...experiencesData);
		}

		return experiences;
	};

	const getEducationInformation = async () => {
		const { educationInformation: selector } = selectorProfile;
		const educationItems = document.querySelectorAll(selector.list);
		const educationArray = Array.from(educationItems);
		const educations = educationArray.map((el) => {
			const institution = el.querySelector(selector.institution).innerText;
			const career = el.querySelector(selector.career).innerText;
			const date = el.querySelector(selector.date).innerText;
			return { institution, career, date };
		});
		return educations;
	};

	await autoscrollToElement("body");
	await clickOnMoreResume();

	const personalInformation = await getPersonalInformation();
	const experienceInformation = await getExperienceInformation();
	const educationInformation = await getEducationInformation();

	await wait(1000);

	const profile = {
		...personalInformation,
		experiences: experienceInformation,
		educations: educationInformation,
	};

	console.log({ profile });
};
