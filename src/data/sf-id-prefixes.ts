/**
 * Key prefixes (first 3 characters of a record ID) for common STANDARD objects.
 *
 * Compiled from commonly published prefix tables and cross-checked against Salesforce
 * Help. Salesforce does not guarantee a prefix is identical in every org, and custom
 * objects get an org-specific prefix, so the page tells readers to confirm in their
 * own org (EntityDefinition.KeyPrefix or DescribeSObjectResult.getKeyPrefix()).
 * Add a row only when you are certain of it; do not guess.
 */

export const PREFIX_META = {
	verified: '2026-11-17',
	/** How to read the prefix of any object, including custom ones. */
	howToCheck: 'SELECT QualifiedApiName, KeyPrefix FROM EntityDefinition WHERE KeyPrefix != null',
	apexCheck: "Account.SObjectType.getDescribe().getKeyPrefix()",
} as const;

export interface PrefixRow {
	prefix: string;
	object: string;
	/** API name when it differs from the label. */
	apiName?: string;
}

export const ID_PREFIXES: PrefixRow[] = [
	{ prefix: '001', object: 'Account' },
	{ prefix: '003', object: 'Contact' },
	{ prefix: '005', object: 'User' },
	{ prefix: '006', object: 'Opportunity' },
	{ prefix: '007', object: 'Activity' },
	{ prefix: '00Q', object: 'Lead' },
	{ prefix: '500', object: 'Case' },
	{ prefix: '701', object: 'Campaign' },
	{ prefix: '00D', object: 'Organization' },
	{ prefix: '00T', object: 'Task' },
	{ prefix: '00U', object: 'Event' },
	{ prefix: '012', object: 'Record Type', apiName: 'RecordType' },
	{ prefix: '00e', object: 'Profile' },
	{ prefix: '0PS', object: 'Permission Set', apiName: 'PermissionSet' },
	{ prefix: '00G', object: 'Group' },
	{ prefix: '00E', object: 'User Role', apiName: 'UserRole' },
	{ prefix: '01p', object: 'Apex Class', apiName: 'ApexClass' },
	{ prefix: '01q', object: 'Apex Trigger', apiName: 'ApexTrigger' },
	{ prefix: '015', object: 'Document' },
	{ prefix: '00P', object: 'Attachment' },
	{ prefix: '068', object: 'Content Version', apiName: 'ContentVersion' },
	{ prefix: '069', object: 'Content Document', apiName: 'ContentDocument' },
	{ prefix: '00X', object: 'Email Template', apiName: 'EmailTemplate' },
	{ prefix: '00O', object: 'Report' },
	{ prefix: '01Z', object: 'Dashboard' },
	{ prefix: '01t', object: 'Product', apiName: 'Product2' },
	{ prefix: '01s', object: 'Price Book', apiName: 'Pricebook2' },
	{ prefix: '00k', object: 'Opportunity Product', apiName: 'OpportunityLineItem' },
	{ prefix: '02i', object: 'Asset' },
	{ prefix: '800', object: 'Contract' },
	{ prefix: '801', object: 'Order' },
	{ prefix: '0D5', object: 'Feed Item', apiName: 'FeedItem' },
];

/** Lookup by prefix, case-sensitive (prefixes are case-sensitive: 00e is a Profile, 00E a User Role). */
export const PREFIX_BY_KEY: Record<string, PrefixRow> = Object.fromEntries(ID_PREFIXES.map((p) => [p.prefix, p]));
