import { App, Notice } from "obsidian";
import { i18nConfig } from "../../lang/I18n";
import { DatabaseDetails } from "../../ui/settingTabs";

interface MarkdownData {
	markDownData: string;
	nowFile: TFile;
	cover: string;
	[key: string]: any;
}

interface GeneralValues {
	title: string;
	tags: string[];
}

interface NextValues {
	title: string;
	emoji: string;
	tags: string[];
	type: string;
	slug: string;
	stats: string;
	category: string;
	summary: string;
	paword: string;
	favicon: string;
	datetime: string;
}

export async function getMarkdown(
	app: App,
	dbDetails: DatabaseDetails,
): Promise<MarkdownData | undefined> {
	const nowFile = app.workspace.getActiveFile();

	if (!nowFile) {
		new Notice(i18nConfig["open-file"]);
		return;
	}

	const markDownData = await nowFile.vault.read(nowFile);

	const { format } = dbDetails; // general, next or custom
	const cover = fileCache.frontmatter.coverurl || '';
	const FileCache = app.metadataCache.getFileCache(nowFile);
	let result: MarkdownData = { markDownData, cover }; // title will be saved in the values object

	try {
		switch (format) {
			case "general":
				result = { ...result, ...getGeneralFormat(FileCache, dbDetails, nowFile) };
				break;
			case "next":
				result = { ...result, ...getNextFormat(FileCache, nowFile) };
				break;
			case "custom":
				result = { ...result, ...getCustomFormat(FileCache, dbDetails, nowFile) };
				break;
			default:
				throw new Error(`Unsupported format: ${format}`);
		}
	} catch (error) {
		console.error('Error processing markdown:', error);
		new Notice(i18nConfig["set-tags-fail"]);
	}

	return result;
}

// TODO: use the front matter as the title

function getGeneralFormat(fileCache: FileCache, nowFile: TFile): Record<string, any> {
	const { customTitleButton, customTitleName, tagButton } = dbDetails;
	const GeneralValues: GeneralValues = {
		title: '',
		tags: [],
	};

	if (fileCache && fileCache.frontmatter) {
		GeneralValues.title = fileCache.frontmatter.title || nowFile.basename;
		GeneralValues.tags = fileCache.frontmatter.tags || [];
	}

	return { GeneralValues };
}

function getNextFormat(fileCache: FileCache, nowFile: TFile): Record<string, any> {
	const NextValues: NextValues = {
		title: '',
		emoji: '',
		tags: [],
		type: '',
		slug: '',
		stats: '',
		category: '',
		summary: '',
		paword: '',
		favicon: '',
		datetime: ''
	};

	if (fileCache && fileCache.frontmatter) {
		NextValues.title = fileCache.frontmatter.title || nowFile.basename;
		NextValues.emoji = fileCache.frontmatter.titleicon || '';
		NextValues.tags = fileCache.frontmatter.tags || [];
		NextValues.type = fileCache.frontmatter.type || '';
		NextValues.slug = fileCache.frontmatter.slug || '';
		NextValues.stats = fileCache.frontmatter.stats || fileCache.frontmatter.status || '';
		NextValues.category = fileCache.frontmatter.category || '';
		NextValues.summary = fileCache.frontmatter.summary || '';
		NextValues.paword = fileCache.frontmatter.password || '';
		NextValues.favicon = fileCache.frontmatter.icon || '';
		NextValues.datetime = fileCache.frontmatter.date || '';
	}

	return { NextValues };
}

function getCustomFormat(fileCache: FileCache, dbDetails: DatabaseDetails, nowFile: TFile): Record<string, any> {
	const customValues: Record<string, any> = {};

	dbDetails.customProperties
		.filter(property => property.customType !== 'title') // Exclude 'title' type property
		.forEach(({ customName }) => {
			if (fileCache.frontmatter[customName] !== undefined) {
				customValues[customName] = fileCache.frontmatter[customName];
			}
		});

	const titleProperty = dbDetails.customProperties.find(property => property.customType === 'title');

	// If a 'title' type property exists, use the file's basename as its value

	if (titleProperty) {
		customValues[titleProperty.customName] = nowFile.basename; // Use 'basename' for the file name without extension
	}

	return { customValues };
}
