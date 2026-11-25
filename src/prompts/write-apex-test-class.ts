import type { PromptMeta } from '../lib/prompts';

const prompt: PromptMeta = {
	slug: 'write-apex-test-class',
	title: 'Write an Apex Test Class',
	tagline: 'Turn an Apex class or trigger into a test class with bulk, positive and negative cases and real assertions.',
	description:
		'A tested prompt that writes an Apex test class from your class or trigger: @TestSetup data, bulk tests, System.Assert messages and callout mocks, with a checklist.',
	category: 'testing',
	tags: ['apex', 'testing', 'test-class', 'assertions', 'bulkification', 'prompts'],
	summary:
		'This prompt asks an AI assistant to write a complete Apex test class for a class or trigger you paste in. It returns tests with shared setup data, a bulk case, positive and negative cases, and assertions that carry messages, plus mocks only when the code makes callouts. It cannot know your org\'s validation rules, so you still run the tests yourself.',
	useWhen: [
		'You have written a class or trigger and need a first draft of the test class before deploying.',
		'You want tests that check behavior with assertions, not only code that runs through every line.',
		'You want a bulk test with 200 or more records for trigger and batch logic from the start.',
	],
	variables: [
		{
			name: 'class_source',
			label: 'Class or trigger source',
			help: 'Paste the full source of the class or trigger you want to test.',
			example: `public with sharing class OpportunityDiscountService {
    public static final Decimal DISCOUNT_RATE = 0.10;
    public static final Decimal MINIMUM_AMOUNT = 10000;

    // Applies a 10% discount to the Amount of open Opportunities that are
    // at or above the minimum amount. Returns the number of records updated.
    public static Integer applyDiscount(Set<Id> opportunityIds) {
        if (opportunityIds == null || opportunityIds.isEmpty()) {
            return 0;
        }
        List<Opportunity> toUpdate = new List<Opportunity>();
        for (Opportunity opp : [
            SELECT Id, Amount
            FROM Opportunity
            WHERE Id IN :opportunityIds AND IsClosed = false
        ]) {
            if (opp.Amount != null && opp.Amount >= MINIMUM_AMOUNT) {
                opp.Amount = (opp.Amount * (1 - DISCOUNT_RATE)).setScale(2);
                toUpdate.add(opp);
            }
        }
        if (!toUpdate.isEmpty()) {
            update toUpdate;
        }
        return toUpdate.size();
    }
}`,
			multiline: true,
		},
		{
			name: 'test_data_notes',
			label: 'Test data notes (optional)',
			help: 'Required fields, validation rules, record types or factory classes to use. Leave blank or write "none" if you have no notes.',
			example:
				'Opportunity needs only Name, StageName and CloseDate in this org. There are no custom validation rules on Opportunity. Use the standard stages Prospecting and Closed Won. There is no test data factory.',
			multiline: true,
		},
	],
	prompt: `You are an expert Salesforce Apex developer who writes thorough, maintainable unit tests. Write a complete Apex test class for the code below.

Requirements:
- Name the test class after the code under test with a Test suffix. Declare it @IsTest. Do not use @IsTest(SeeAllData=true).
- Create all test data in the test. Put shared records in a @TestSetup method and query them in the tests. Create only the fields that are required or that the logic reads.
- Cover the positive path, the negative paths (null, empty and invalid input, records that must not be changed) and boundary values.
- If the code is a trigger, or does batch-style work on a list of records, include a bulk test with at least 200 records, because triggers run in chunks of 200.
- Use the System.Assert methods in the form System.Assert.areEqual(expected, actual, message), System.Assert.isTrue(condition, message), System.Assert.isNull(value, message) and System.Assert.isNotNull(value, message). Every assertion gets a message that says what was expected. Assert on results and on data re-queried from the database, not only that no exception was thrown. Do not use System.assertEquals unless you are sure the form above does not fit.
- Put Test.startTest() and Test.stopTest() around the call that runs the code under test. Always do this for asynchronous work (Queueable, future, Batch, Schedulable) so the job runs before you assert.
- If the code makes HTTP callouts, write an HttpCalloutMock implementation, register it with Test.setMock, and test both a success response and an error response. If it makes no callouts, do not add a mock.
- Only if the code enforces field-level security, object permissions or sharing (for example WITH USER_MODE, WITH SECURITY_ENFORCED, Security.stripInaccessible or logic that depends on record access), add a test that runs as a user with limited access using System.runAs. Otherwise do not write one.
- Each test method tests one behavior and has a name that says which. Use constants for repeated values.
- Do not invent fields, objects or classes. If the test needs something that is not in the code or the notes, use a clearly named placeholder and list it under Notes.
- Do not change the code under test. If you find a bug or something untestable, say so under Notes instead of fixing it.

Code under test:
{{class_source}}

Test data notes (may be blank):
{{test_data_notes}}

Output format:
1. The complete test class in one apex code block.
2. A short "Notes" list: what each test covers, any assumption you made, and anything you could not test.`,
	output: {
		language: 'apex',
		body: `// OpportunityDiscountServiceTest.cls
@IsTest
private class OpportunityDiscountServiceTest {
    private static final Integer ELIGIBLE_COUNT = 100;
    private static final Integer SMALL_COUNT = 100;
    private static final Decimal ELIGIBLE_AMOUNT = 20000;
    private static final Decimal DISCOUNTED_AMOUNT = 18000;
    private static final Decimal SMALL_AMOUNT = 5000;
    private static final String OPEN_STAGE = 'Prospecting';
    private static final String CLOSED_STAGE = 'Closed Won';

    @TestSetup
    static void makeData() {
        List<Opportunity> opps = new List<Opportunity>();
        for (Integer i = 0; i < ELIGIBLE_COUNT; i++) {
            opps.add(buildOpportunity('Eligible ' + i, ELIGIBLE_AMOUNT, OPEN_STAGE));
        }
        for (Integer i = 0; i < SMALL_COUNT; i++) {
            opps.add(buildOpportunity('Small ' + i, SMALL_AMOUNT, OPEN_STAGE));
        }
        opps.add(buildOpportunity('No Amount', null, OPEN_STAGE));
        opps.add(buildOpportunity('Closed Won Deal', ELIGIBLE_AMOUNT, CLOSED_STAGE));
        insert opps;
    }

    @IsTest
    static void applyDiscount_bulkRecords_discountsOnlyEligibleOpenOpportunities() {
        Set<Id> allIds = new Map<Id, Opportunity>([SELECT Id FROM Opportunity]).keySet();
        System.Assert.areEqual(
            ELIGIBLE_COUNT + SMALL_COUNT + 2,
            allIds.size(),
            'The test setup should have created 202 Opportunities'
        );

        Test.startTest();
        Integer updated = OpportunityDiscountService.applyDiscount(allIds);
        Test.stopTest();

        System.Assert.areEqual(ELIGIBLE_COUNT, updated, 'Only the 100 eligible open Opportunities should be updated');

        Integer eligibleChecked = 0;
        for (Opportunity opp : [SELECT Name, Amount FROM Opportunity]) {
            if (opp.Name.startsWith('Eligible')) {
                assertAmount(DISCOUNTED_AMOUNT, opp.Amount, opp.Name + ' should be discounted by 10%');
                eligibleChecked++;
            } else if (opp.Name.startsWith('Small')) {
                assertAmount(SMALL_AMOUNT, opp.Amount, opp.Name + ' is below the minimum and should not change');
            } else if (opp.Name == 'No Amount') {
                System.Assert.isNull(opp.Amount, 'An Opportunity without an Amount should stay without one');
            } else if (opp.Name == 'Closed Won Deal') {
                assertAmount(ELIGIBLE_AMOUNT, opp.Amount, 'A closed Opportunity should not be discounted');
            }
        }
        System.Assert.areEqual(ELIGIBLE_COUNT, eligibleChecked, 'All 100 eligible Opportunities should have been checked');
    }

    @IsTest
    static void applyDiscount_amountEqualToMinimum_isDiscounted() {
        Opportunity boundary = buildOpportunity('Boundary', OpportunityDiscountService.MINIMUM_AMOUNT, OPEN_STAGE);
        insert boundary;

        Test.startTest();
        Integer updated = OpportunityDiscountService.applyDiscount(new Set<Id>{ boundary.Id });
        Test.stopTest();

        System.Assert.areEqual(1, updated, 'An Amount equal to the minimum should be discounted');
        Opportunity result = [SELECT Amount FROM Opportunity WHERE Id = :boundary.Id];
        assertAmount(9000, result.Amount, 'An Amount of 10000 should become 9000');
    }

    @IsTest
    static void applyDiscount_amountBelowMinimum_returnsZeroAndKeepsAmount() {
        Set<Id> smallIds = new Map<Id, Opportunity>([SELECT Id FROM Opportunity WHERE Name LIKE 'Small %']).keySet();

        Test.startTest();
        Integer updated = OpportunityDiscountService.applyDiscount(smallIds);
        Test.stopTest();

        System.Assert.areEqual(0, updated, 'No Opportunity below the minimum should be updated');
        Integer stillSmall = [SELECT COUNT() FROM Opportunity WHERE Name LIKE 'Small %' AND Amount = :SMALL_AMOUNT];
        System.Assert.areEqual(SMALL_COUNT, stillSmall, 'All small Opportunities should keep their Amount');
    }

    @IsTest
    static void applyDiscount_closedOpportunity_isSkipped() {
        Opportunity closed = [SELECT Id FROM Opportunity WHERE Name = 'Closed Won Deal'];

        Test.startTest();
        Integer updated = OpportunityDiscountService.applyDiscount(new Set<Id>{ closed.Id });
        Test.stopTest();

        System.Assert.areEqual(0, updated, 'A closed Opportunity should not be updated');
        Opportunity result = [SELECT Amount FROM Opportunity WHERE Id = :closed.Id];
        assertAmount(ELIGIBLE_AMOUNT, result.Amount, 'The closed Opportunity Amount should be unchanged');
    }

    @IsTest
    static void applyDiscount_nullOrEmptyIds_returnsZeroAndChangesNothing() {
        Test.startTest();
        Integer nullResult = OpportunityDiscountService.applyDiscount(null);
        Integer emptyResult = OpportunityDiscountService.applyDiscount(new Set<Id>());
        Test.stopTest();

        System.Assert.areEqual(0, nullResult, 'A null Set should return 0');
        System.Assert.areEqual(0, emptyResult, 'An empty Set should return 0');
        Integer untouched = [SELECT COUNT() FROM Opportunity WHERE Amount = :ELIGIBLE_AMOUNT];
        System.Assert.areEqual(
            ELIGIBLE_COUNT + 1,
            untouched,
            'No Amount should change: 100 open and 1 closed Opportunity still have 20000'
        );
    }

    private static Opportunity buildOpportunity(String name, Decimal amount, String stageName) {
        return new Opportunity(
            Name = name,
            Amount = amount,
            StageName = stageName,
            CloseDate = Date.today().addDays(30)
        );
    }

    private static void assertAmount(Decimal expected, Decimal actual, String message) {
        System.Assert.isNotNull(actual, message + ' (Amount was null)');
        System.Assert.areEqual(expected.setScale(2), actual.setScale(2), message);
    }
}

// Notes
// - bulk: 202 Opportunities in one call (100 eligible, 100 below the minimum, 1 without Amount, 1 closed). Checks the count and every record's Amount.
// - boundary: an Amount of exactly 10000 is discounted to 9000.
// - negative: below the minimum, closed Opportunity, null Set and empty Set change nothing and return 0.
// - Test data is created in @TestSetup with only Name, StageName, CloseDate and Amount. No SeeAllData.
// - The class makes no callouts, so there is no HttpCalloutMock.
// - The class is declared with sharing but has no explicit field-level security or sharing logic, so there is no System.runAs test.
// - Assumes the standard stages Prospecting and Closed Won exist and that no validation or duplicate rule blocks these records.`,
	},
	checklist: [
		'The class is @IsTest, uses no SeeAllData=true, and creates its own data (shared records in @TestSetup).',
		'Every test has assertions with messages, and the assertions check values re-queried from the database, not only that nothing threw.',
		'There is a bulk test with 200 or more records when the code is a trigger or batch-style logic, and it asserts on every record or a count, not on one sample.',
		'Negative cases exist: null or empty input, records that must stay unchanged, and boundary values.',
		'Test.startTest and Test.stopTest wrap the code under test, and any async job is finished before the assertions run.',
		'A callout mock exists only if the code makes callouts, and a System.runAs test exists only if the code enforces permissions or sharing.',
		'Every field, stage value and class the test uses really exists in your org, and the test does not edit the code under test.',
	],
	caveats: [
		'Coverage is not quality. A test class can reach every line and still prove nothing. Read the assertions and ask what bug each one would catch.',
		'Required fields, validation rules, duplicate rules, record types and other automation in your real org can make the generated test data fail to insert. Put them in the test data notes, or reuse your own test data factory.',
		'The example test class was not compiled or run, so treat it as a draft and run it in a sandbox or scratch org before you rely on it.',
		'The assistant cannot see your org. Picklist values such as stage names, and fields it assumes, are guesses unless you provide them.',
		'Tests that depend on the current date or on org-wide data can pass today and fail later. Check for those and make the data explicit.',
	],
	tips: [
		'Paste the trigger handler and the trigger together if you want both covered, and ask for DML-based tests that fire the trigger.',
		'If your team has a TestDataFactory class, put its method names in the test data notes and ask the assistant to use it.',
		'After the first run, paste the failures back with the stack trace and ask for a fix to the test, not to the class.',
	],
	tested: {
		model: 'Claude Sonnet 5.5',
		date: '2026-11-17',
		method:
			'We ran the prompt with the example class and notes, took the test class above, and reviewed it line by line against the checklist: setup data, 202-record bulk test, boundary and negative cases, assertion messages, startTest and stopTest, no mock or runAs where none is needed. We also walked the class logic by hand to confirm each assertion matches what the class does.',
		notVerified:
			'The test class and the class under test were not compiled, deployed or run in an org, so syntax errors, org validation rules, and the exact Decimal comparison behavior are not ruled out.',
	},
	faq: [
		{
			q: 'Why does the prompt forbid SeeAllData=true?',
			a: 'Tests that read real org data break when that data changes and can behave differently in a sandbox and in production. Creating the records in the test, usually in a @TestSetup method, makes the result repeatable.',
		},
		{
			q: 'Why a bulk test with 200 records?',
			a: 'Triggers run on chunks of up to 200 records, so a test with one record cannot reveal a query or DML inside a loop. A bulk test fails early on the governor limits that matter in production.',
		},
		{
			q: 'Why System.Assert.areEqual and not System.assertEquals?',
			a: 'The System.Assert class takes a message with every call and reads clearly in failure output. The older System.assertEquals still works, so existing tests do not need to change.',
		},
		{
			q: 'Does the assistant write the callout mock for me?',
			a: 'Only when the code makes callouts. It writes an HttpCalloutMock class and registers it with Test.setMock, with one success and one error response. A class without callouts gets no mock.',
		},
		{
			q: 'Does a passing generated test mean the code is correct?',
			a: 'No. It means the code does what the assertions check. Review the assertions against your requirements, run the tests in a sandbox, and add cases for the rules the assistant could not know about.',
		},
	],
	related: {
		tools: ['governor-limits'],
		skills: ['apex-code-reviewer'],
		prompts: ['generate-apex-trigger-handler', 'review-apex-governor-limit-risks'],
		docs: ['apex/trigger-handler-pattern', 'integration/named-credentials-callouts'],
	},
	refs: [
		'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_testing.htm',
		'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_testing_testsetup_using.htm',
		'https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_gov_limits.htm',
	],
	published: '2026-11-17',
	updated: '2026-11-17',
};

export default prompt;
