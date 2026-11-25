/**
 * Common Metadata API types for the package.xml generator. `slug` is the article
 * under src/content/docs/metadata/ (verified to exist, and its title starts with the API name).
 * Source: Metadata API Developer Guide, Metadata Types.
 */
export const PACKAGE_XML_META = {
	source: 'https://developer.salesforce.com/docs/atlas.en-us.api_meta.meta/api_meta/manifest_samples.htm',
	sourceName: 'Metadata API Developer Guide: Sample package.xml Manifest Files',
	release: "Winter '27",
	apiVersion: '68.0',
	verified: '2026-11-17',
} as const;

export interface CommonType {
	name: string;
	slug: string;
	what: string;
}

export const COMMON_TYPES: CommonType[] = [
	{ name: 'ApexClass', slug: 'apex-class', what: 'Apex classes' },
	{ name: 'ApexTrigger', slug: 'apex-trigger', what: 'Apex triggers' },
	{ name: 'ApexPage', slug: 'apex-page', what: 'Visualforce pages' },
	{ name: 'ApexComponent', slug: 'apex-component', what: 'Visualforce components' },
	{ name: 'AuraDefinitionBundle', slug: 'aura-definition-bundle', what: 'Aura components' },
	{ name: 'LightningComponentBundle', slug: 'lightning-component-bundle', what: 'Lightning Web Components' },
	{ name: 'CustomObject', slug: 'custom-object', what: 'Custom and standard objects, with their fields and other child components' },
	{ name: 'CustomField', slug: 'custom-field', what: 'Individual fields, as Object.Field members' },
	{ name: 'ValidationRule', slug: 'validation-rule', what: 'Validation rules, as Object.Rule members' },
	{ name: 'RecordType', slug: 'record-type', what: 'Record types, as Object.RecordType members' },
	{ name: 'Layout', slug: 'layout', what: 'Page layouts' },
	{ name: 'FlexiPage', slug: 'flexipage', what: 'Lightning pages' },
	{ name: 'CustomTab', slug: 'custom-tab', what: 'Custom tabs' },
	{ name: 'CustomApplication', slug: 'custom-application', what: 'Apps, including Lightning apps' },
	{ name: 'Flow', slug: 'flow', what: 'Flows' },
	{ name: 'PermissionSet', slug: 'permission-set', what: 'Permission sets' },
	{ name: 'Profile', slug: 'profile', what: 'Profiles' },
	{ name: 'StaticResource', slug: 'static-resource', what: 'Static resources' },
	{ name: 'EmailTemplate', slug: 'email-template', what: 'Email templates (members include the folder name)' },
	{ name: 'CustomLabels', slug: 'custom-labels', what: 'Custom labels' },
];
