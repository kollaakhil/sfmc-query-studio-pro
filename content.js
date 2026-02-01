// =============================================================================
// SFMC Query Studio Pro v2.0 — Content Script
// The ultimate SQL editor for Salesforce Marketing Cloud
// Features: SFMC-specific highlighting, smart autocomplete, query templates,
//           SQL validation, query explain panel, and more
// =============================================================================

(function () {
  'use strict';

  // ---------- Standard SQL Keywords ----------
  const SQL_KEYWORDS = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
    'FULL', 'CROSS', 'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN',
    'LIKE', 'IS', 'NULL', 'AS', 'DISTINCT', 'TOP', 'ORDER', 'BY', 'GROUP',
    'HAVING', 'UNION', 'ALL', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
    'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX', 'CASE', 'WHEN',
    'THEN', 'ELSE', 'END', 'ASC', 'DESC', 'WITH', 'LIMIT', 'OFFSET',
    'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'LEN', 'SUBSTRING', 'REPLACE',
    'TRIM', 'LTRIM', 'RTRIM', 'UPPER', 'LOWER', 'CONCAT', 'CHARINDEX',
    'RANK', 'DENSE_RANK', 'OVER', 'PARTITION', 'FORMAT', 'DATEPART',
    'DATENAME', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND',
    'DECLARE', 'BEGIN', 'RETURN', 'WHILE', 'IF', 'PRINT', 'EXEC',
    'EXECUTE', 'GO', 'USE', 'TRUNCATE', 'MERGE', 'EXCEPT', 'INTERSECT',
    'PIVOT', 'UNPIVOT', 'FETCH', 'NEXT', 'ROWS', 'ONLY', 'PERCENT',
    'ROLLUP', 'CUBE', 'GROUPING', 'OUTPUT', 'INSERTED', 'DELETED',
    'IDENTITY', 'SCOPE_IDENTITY', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
    'CONSTRAINT', 'CHECK', 'DEFAULT', 'UNIQUE', 'CLUSTERED', 'NONCLUSTERED',
    'NOLOCK', 'HOLDLOCK', 'READUNCOMMITTED', 'SERIALIZABLE', 'OPTION',
    'RECOMPILE', 'APPLY'
  ];

  // ---------- SFMC-Specific SQL Functions (highlighted differently) ----------
  const SFMC_FUNCTIONS = [
    'DATEADD', 'DATEDIFF', 'GETDATE', 'GETUTCDATE', 'CONVERT', 'CAST',
    'HASHBYTES', 'NEWID', 'ISNULL', 'COALESCE', 'ROW_NUMBER',
    'STUFF', 'IIF', 'CHOOSE', 'TRY_CONVERT', 'TRY_CAST',
    'SWITCHOFFSET', 'TODATETIMEOFFSET', 'EOMONTH', 'DATEFROMPARTS',
    'ISDATE', 'SYSDATETIME', 'SYSUTCDATETIME', 'SYSDATETIMEOFFSET',
    'PATINDEX', 'QUOTENAME', 'REPLICATE', 'REVERSE', 'SPACE',
    'STR', 'STRING_AGG', 'STRING_SPLIT', 'TRANSLATE', 'UNICODE',
    'NCHAR', 'CHAR', 'ASCII', 'SOUNDEX', 'DIFFERENCE',
    'ABS', 'CEILING', 'FLOOR', 'ROUND', 'SIGN', 'POWER', 'SQRT',
    'LOG', 'LOG10', 'EXP', 'RAND', 'PI',
    'CHECKSUM', 'BINARY_CHECKSUM', 'COMPRESS', 'DECOMPRESS',
    'OBJECT_ID', 'OBJECT_NAME', 'DB_NAME', 'DB_ID',
    'SCHEMA_NAME', 'SCHEMA_ID', 'TYPE_NAME', 'TYPE_ID',
    'COLUMNPROPERTY', 'DATALENGTH'
  ];

  // ---------- SQL Functions with signatures ----------
  const SQL_FUNCTION_SIGS = [
    { text: 'COUNT(', type: 'function', hint: 'COUNT(expression)' },
    { text: 'SUM(', type: 'function', hint: 'SUM(expression)' },
    { text: 'AVG(', type: 'function', hint: 'AVG(expression)' },
    { text: 'MIN(', type: 'function', hint: 'MIN(expression)' },
    { text: 'MAX(', type: 'function', hint: 'MAX(expression)' },
    { text: 'LEN(', type: 'function', hint: 'LEN(string)' },
    { text: 'SUBSTRING(', type: 'function', hint: 'SUBSTRING(string, start, length)' },
    { text: 'REPLACE(', type: 'function', hint: 'REPLACE(string, find, replace)' },
    { text: 'TRIM(', type: 'function', hint: 'TRIM(string)' },
    { text: 'LTRIM(', type: 'function', hint: 'LTRIM(string)' },
    { text: 'RTRIM(', type: 'function', hint: 'RTRIM(string)' },
    { text: 'UPPER(', type: 'function', hint: 'UPPER(string)' },
    { text: 'LOWER(', type: 'function', hint: 'LOWER(string)' },
    { text: 'CONCAT(', type: 'function', hint: 'CONCAT(str1, str2, ...)' },
    { text: 'CHARINDEX(', type: 'function', hint: 'CHARINDEX(find, string, start)' },
    { text: 'FORMAT(', type: 'function', hint: 'FORMAT(value, format, culture)' },
    // SFMC-specific functions
    { text: 'DATEADD(', type: 'sfmc', hint: 'DATEADD(datepart, number, date)' },
    { text: 'DATEDIFF(', type: 'sfmc', hint: 'DATEDIFF(datepart, start, end)' },
    { text: 'GETDATE()', type: 'sfmc', hint: 'Returns current datetime' },
    { text: 'GETUTCDATE()', type: 'sfmc', hint: 'Returns current UTC datetime' },
    { text: 'CONVERT(', type: 'sfmc', hint: 'CONVERT(type, expression, style)' },
    { text: 'CAST(', type: 'sfmc', hint: 'CAST(expression AS type)' },
    { text: 'HASHBYTES(', type: 'sfmc', hint: "HASHBYTES('algorithm', input)" },
    { text: 'NEWID()', type: 'sfmc', hint: 'Returns a new uniqueidentifier' },
    { text: 'ISNULL(', type: 'sfmc', hint: 'ISNULL(check, replacement)' },
    { text: 'COALESCE(', type: 'sfmc', hint: 'COALESCE(val1, val2, ...)' },
    { text: 'ROW_NUMBER() OVER(', type: 'sfmc', hint: 'ROW_NUMBER() OVER(PARTITION BY col ORDER BY col)' },
    { text: 'STUFF(', type: 'sfmc', hint: 'STUFF(string, start, length, insert)' },
    { text: 'IIF(', type: 'sfmc', hint: 'IIF(condition, true_val, false_val)' },
    { text: 'CHOOSE(', type: 'sfmc', hint: 'CHOOSE(index, val1, val2, ...)' },
    { text: 'TRY_CONVERT(', type: 'sfmc', hint: 'TRY_CONVERT(type, expression, style)' },
    { text: 'TRY_CAST(', type: 'sfmc', hint: 'TRY_CAST(expression AS type)' },
    { text: 'EOMONTH(', type: 'sfmc', hint: 'EOMONTH(start_date, months)' },
    { text: 'DATEFROMPARTS(', type: 'sfmc', hint: 'DATEFROMPARTS(year, month, day)' },
    { text: 'ISDATE(', type: 'sfmc', hint: 'ISDATE(expression)' },
    { text: 'DATEPART(', type: 'sfmc', hint: 'DATEPART(datepart, date)' },
    { text: 'DATENAME(', type: 'sfmc', hint: 'DATENAME(datepart, date)' },
    { text: 'RANK() OVER(', type: 'function', hint: 'RANK() OVER(ORDER BY col)' },
    { text: 'DENSE_RANK() OVER(', type: 'function', hint: 'DENSE_RANK() OVER(ORDER BY col)' },
    { text: 'PATINDEX(', type: 'sfmc', hint: "PATINDEX('%pattern%', expression)" },
    { text: 'QUOTENAME(', type: 'sfmc', hint: "QUOTENAME(string, quote_char)" },
    { text: 'ABS(', type: 'sfmc', hint: 'ABS(numeric_expression)' },
    { text: 'CEILING(', type: 'sfmc', hint: 'CEILING(numeric_expression)' },
    { text: 'FLOOR(', type: 'sfmc', hint: 'FLOOR(numeric_expression)' },
    { text: 'ROUND(', type: 'sfmc', hint: 'ROUND(expression, length)' }
  ];

  // ---------- SFMC Query Templates ----------
  const SFMC_TEMPLATES = [
    {
      id: 'tmpl-dedup-email',
      name: '🔄 Deduplicate by Email',
      description: 'Remove duplicate subscribers keeping the most recent record',
      sql: `SELECT\n  SubscriberKey,\n  EmailAddress,\n  FirstName,\n  LastName,\n  DateAdded\nFROM (\n  SELECT\n    *,\n    ROW_NUMBER() OVER (\n      PARTITION BY EmailAddress\n      ORDER BY DateAdded DESC\n    ) AS rn\n  FROM [Your_Data_Extension]\n) sub\nWHERE sub.rn = 1`
    },
    {
      id: 'tmpl-opens-30d',
      name: '📧 Opens in Last 30 Days',
      description: 'Find subscribers who opened emails in the last 30 days',
      sql: `SELECT DISTINCT\n  s.SubscriberKey,\n  s.EmailAddress,\n  o.EventDate AS LastOpenDate\nFROM [_Subscribers] s\nINNER JOIN [_Open] o\n  ON s.SubscriberKey = o.SubscriberKey\nWHERE\n  o.EventDate >= DATEADD(day, -30, GETDATE())\n  AND o.IsUnique = 1\nORDER BY o.EventDate DESC`
    },
    {
      id: 'tmpl-click-no-convert',
      name: '🖱️ Clicked but Didn\'t Convert',
      description: 'Subscribers who clicked but never converted',
      sql: `SELECT DISTINCT\n  c.SubscriberKey,\n  c.EmailAddress,\n  c.EventDate AS ClickDate,\n  c.URL\nFROM [_Click] c\nLEFT JOIN [Conversions] conv\n  ON c.SubscriberKey = conv.SubscriberKey\n  AND conv.ConversionDate >= c.EventDate\nWHERE\n  c.EventDate >= DATEADD(day, -30, GETDATE())\n  AND c.IsUnique = 1\n  AND conv.SubscriberKey IS NULL\nORDER BY c.EventDate DESC`
    },
    {
      id: 'tmpl-join-de',
      name: '🔗 Join Subscribers with DE',
      description: 'Join subscriber data with a custom data extension',
      sql: `SELECT\n  s.SubscriberKey,\n  s.EmailAddress,\n  s.Status,\n  de.CustomField1,\n  de.CustomField2,\n  de.LastModified\nFROM [_Subscribers] s\nINNER JOIN [Your_Data_Extension] de\n  ON s.SubscriberKey = de.SubscriberKey\nWHERE\n  s.Status = 'Active'`
    },
    {
      id: 'tmpl-engagement-score',
      name: '⭐ Engagement Scoring',
      description: 'Calculate engagement score based on opens, clicks, and bounces',
      sql: `SELECT\n  s.SubscriberKey,\n  s.EmailAddress,\n  ISNULL(opens.OpenCount, 0) AS Opens,\n  ISNULL(clicks.ClickCount, 0) AS Clicks,\n  ISNULL(bounces.BounceCount, 0) AS Bounces,\n  (\n    ISNULL(opens.OpenCount, 0) * 1\n    + ISNULL(clicks.ClickCount, 0) * 3\n    - ISNULL(bounces.BounceCount, 0) * 5\n  ) AS EngagementScore\nFROM [_Subscribers] s\nLEFT JOIN (\n  SELECT SubscriberKey, COUNT(*) AS OpenCount\n  FROM [_Open]\n  WHERE EventDate >= DATEADD(day, -90, GETDATE())\n  GROUP BY SubscriberKey\n) opens ON s.SubscriberKey = opens.SubscriberKey\nLEFT JOIN (\n  SELECT SubscriberKey, COUNT(*) AS ClickCount\n  FROM [_Click]\n  WHERE EventDate >= DATEADD(day, -90, GETDATE())\n  GROUP BY SubscriberKey\n) clicks ON s.SubscriberKey = clicks.SubscriberKey\nLEFT JOIN (\n  SELECT SubscriberKey, COUNT(*) AS BounceCount\n  FROM [_Bounce]\n  WHERE EventDate >= DATEADD(day, -90, GETDATE())\n  GROUP BY SubscriberKey\n) bounces ON s.SubscriberKey = bounces.SubscriberKey\nWHERE s.Status = 'Active'\nORDER BY EngagementScore DESC`
    },
    {
      id: 'tmpl-bounce-analysis',
      name: '🔴 Bounce Analysis',
      description: 'Analyze bounce types and frequency',
      sql: `SELECT\n  b.SubscriberKey,\n  s.EmailAddress,\n  b.BounceCategory,\n  b.BounceSubcategory,\n  b.SMTPBounceReason,\n  COUNT(*) AS BounceCount,\n  MAX(b.EventDate) AS LastBounceDate\nFROM [_Bounce] b\nINNER JOIN [_Subscribers] s\n  ON b.SubscriberKey = s.SubscriberKey\nWHERE\n  b.EventDate >= DATEADD(day, -90, GETDATE())\nGROUP BY\n  b.SubscriberKey,\n  s.EmailAddress,\n  b.BounceCategory,\n  b.BounceSubcategory,\n  b.SMTPBounceReason\nHAVING COUNT(*) >= 2\nORDER BY BounceCount DESC`
    },
    {
      id: 'tmpl-unsub-trend',
      name: '📉 Unsubscribe Trend',
      description: 'Track unsubscribe trends over time',
      sql: `SELECT\n  CONVERT(VARCHAR(7), u.EventDate, 120) AS MonthYear,\n  COUNT(*) AS UnsubCount,\n  COUNT(DISTINCT u.SubscriberKey) AS UniqueUnsubs\nFROM [_Unsubscribe] u\nWHERE\n  u.EventDate >= DATEADD(month, -12, GETDATE())\nGROUP BY\n  CONVERT(VARCHAR(7), u.EventDate, 120)\nORDER BY MonthYear ASC`
    },
    {
      id: 'tmpl-journey-audience',
      name: '🗺️ Journey Entry Audience',
      description: 'Build audience for journey entry based on criteria',
      sql: `SELECT\n  s.SubscriberKey,\n  s.EmailAddress,\n  s.FirstName,\n  de.SegmentName,\n  de.LastPurchaseDate\nFROM [_Subscribers] s\nINNER JOIN [Customer_Data] de\n  ON s.SubscriberKey = de.SubscriberKey\nWHERE\n  s.Status = 'Active'\n  AND de.LastPurchaseDate >= DATEADD(day, -60, GETDATE())\n  AND de.SegmentName IN ('High Value', 'Medium Value')\n  AND s.SubscriberKey NOT IN (\n    SELECT SubscriberKey\n    FROM [Journey_Exclusion_List]\n  )`
    },
    {
      id: 'tmpl-de-cleanup',
      name: '🧹 DE Cleanup (Nulls & Dupes)',
      description: 'Find and prepare records for data extension cleanup',
      sql: `-- Find records with NULL key fields\nSELECT 'NULL_RECORDS' AS IssueType, COUNT(*) AS RecordCount\nFROM [Your_Data_Extension]\nWHERE\n  SubscriberKey IS NULL\n  OR EmailAddress IS NULL\n  OR LEN(LTRIM(RTRIM(EmailAddress))) = 0\n\nUNION ALL\n\n-- Find duplicate records\nSELECT 'DUPLICATES' AS IssueType, COUNT(*) AS RecordCount\nFROM (\n  SELECT\n    EmailAddress,\n    ROW_NUMBER() OVER (\n      PARTITION BY EmailAddress\n      ORDER BY DateAdded DESC\n    ) AS rn\n  FROM [Your_Data_Extension]\n  WHERE EmailAddress IS NOT NULL\n) sub\nWHERE sub.rn > 1`
    },
    {
      id: 'tmpl-date-segment',
      name: '📅 Date-Based Segmentation',
      description: 'Segment subscribers by date ranges',
      sql: `SELECT\n  SubscriberKey,\n  EmailAddress,\n  LastActivityDate,\n  CASE\n    WHEN LastActivityDate >= DATEADD(day, -7, GETDATE())\n      THEN 'Active (7 days)'\n    WHEN LastActivityDate >= DATEADD(day, -30, GETDATE())\n      THEN 'Recent (30 days)'\n    WHEN LastActivityDate >= DATEADD(day, -90, GETDATE())\n      THEN 'Lapsing (90 days)'\n    WHEN LastActivityDate >= DATEADD(day, -180, GETDATE())\n      THEN 'At Risk (180 days)'\n    ELSE 'Inactive (180+ days)'\n  END AS EngagementSegment\nFROM [Your_Data_Extension]\nWHERE\n  Status = 'Active'\nORDER BY LastActivityDate DESC`
    },
    {
      id: 'tmpl-cross-de',
      name: '🔍 Cross-DE Subscriber Lookup',
      description: 'Find a subscriber across multiple data extensions',
      sql: `SELECT\n  'Subscribers' AS SourceDE,\n  SubscriberKey,\n  EmailAddress,\n  Status\nFROM [_Subscribers]\nWHERE EmailAddress = 'user@example.com'\n\nUNION ALL\n\nSELECT\n  'Customer_Data' AS SourceDE,\n  SubscriberKey,\n  EmailAddress,\n  Status\nFROM [Customer_Data]\nWHERE EmailAddress = 'user@example.com'\n\nUNION ALL\n\nSELECT\n  'Purchase_History' AS SourceDE,\n  SubscriberKey,\n  EmailAddress,\n  'N/A' AS Status\nFROM [Purchase_History]\nWHERE EmailAddress = 'user@example.com'`
    },
    {
      id: 'tmpl-send-perf',
      name: '📊 Email Send Performance',
      description: 'Summarize email send performance metrics',
      sql: `SELECT\n  j.EmailName,\n  j.DeliveredTime,\n  COUNT(DISTINCT s.SubscriberKey) AS TotalSent,\n  COUNT(DISTINCT o.SubscriberKey) AS UniqueOpens,\n  COUNT(DISTINCT c.SubscriberKey) AS UniqueClicks,\n  COUNT(DISTINCT b.SubscriberKey) AS Bounces,\n  COUNT(DISTINCT u.SubscriberKey) AS Unsubscribes,\n  CAST(\n    ROUND(COUNT(DISTINCT o.SubscriberKey) * 100.0 / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0), 2)\n    AS DECIMAL(5,2)\n  ) AS OpenRate,\n  CAST(\n    ROUND(COUNT(DISTINCT c.SubscriberKey) * 100.0 / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0), 2)\n    AS DECIMAL(5,2)\n  ) AS ClickRate\nFROM [_Job] j\nLEFT JOIN [_Sent] s ON j.JobID = s.JobID\nLEFT JOIN [_Open] o ON j.JobID = o.JobID AND o.IsUnique = 1\nLEFT JOIN [_Click] c ON j.JobID = c.JobID AND c.IsUnique = 1\nLEFT JOIN [_Bounce] b ON j.JobID = b.JobID\nLEFT JOIN [_Unsubscribe] u ON j.JobID = u.JobID\nWHERE\n  j.DeliveredTime >= DATEADD(day, -30, GETDATE())\nGROUP BY\n  j.EmailName,\n  j.DeliveredTime\nORDER BY j.DeliveredTime DESC`
    },
    {
      id: 'tmpl-ab-test',
      name: '🧪 A/B Test Comparison',
      description: 'Compare A/B test results between two email versions',
      sql: `SELECT\n  'Version A' AS TestVersion,\n  COUNT(DISTINCT s.SubscriberKey) AS Sent,\n  COUNT(DISTINCT o.SubscriberKey) AS Opens,\n  COUNT(DISTINCT c.SubscriberKey) AS Clicks,\n  CAST(ROUND(COUNT(DISTINCT o.SubscriberKey) * 100.0 / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0), 2) AS DECIMAL(5,2)) AS OpenRate,\n  CAST(ROUND(COUNT(DISTINCT c.SubscriberKey) * 100.0 / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0), 2) AS DECIMAL(5,2)) AS CTR\nFROM [_Sent] s\nLEFT JOIN [_Open] o ON s.JobID = o.JobID AND s.SubscriberKey = o.SubscriberKey AND o.IsUnique = 1\nLEFT JOIN [_Click] c ON s.JobID = c.JobID AND s.SubscriberKey = c.SubscriberKey AND c.IsUnique = 1\nWHERE s.JobID = 12345 -- Version A JobID\n\nUNION ALL\n\nSELECT\n  'Version B' AS TestVersion,\n  COUNT(DISTINCT s.SubscriberKey) AS Sent,\n  COUNT(DISTINCT o.SubscriberKey) AS Opens,\n  COUNT(DISTINCT c.SubscriberKey) AS Clicks,\n  CAST(ROUND(COUNT(DISTINCT o.SubscriberKey) * 100.0 / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0), 2) AS DECIMAL(5,2)) AS OpenRate,\n  CAST(ROUND(COUNT(DISTINCT c.SubscriberKey) * 100.0 / NULLIF(COUNT(DISTINCT s.SubscriberKey), 0), 2) AS DECIMAL(5,2)) AS CTR\nFROM [_Sent] s\nLEFT JOIN [_Open] o ON s.JobID = o.JobID AND s.SubscriberKey = o.SubscriberKey AND o.IsUnique = 1\nLEFT JOIN [_Click] c ON s.JobID = c.JobID AND s.SubscriberKey = c.SubscriberKey AND c.IsUnique = 1\nWHERE s.JobID = 12346 -- Version B JobID`
    },
    {
      id: 'tmpl-pref-center',
      name: '⚙️ Preference Center Data',
      description: 'Query subscriber preference center data',
      sql: `SELECT\n  s.SubscriberKey,\n  s.EmailAddress,\n  p.PreferenceCategory,\n  p.OptInStatus,\n  p.Frequency,\n  p.LastUpdated\nFROM [_Subscribers] s\nINNER JOIN [Preference_Center] p\n  ON s.SubscriberKey = p.SubscriberKey\nWHERE\n  s.Status = 'Active'\n  AND p.OptInStatus = 'OptedIn'\nORDER BY p.LastUpdated DESC`
    },
    {
      id: 'tmpl-winback',
      name: '💤 Win-Back Audience',
      description: 'Identify inactive subscribers for win-back campaigns',
      sql: `SELECT\n  s.SubscriberKey,\n  s.EmailAddress,\n  s.FirstName,\n  MAX(o.EventDate) AS LastOpenDate,\n  MAX(c.EventDate) AS LastClickDate,\n  DATEDIFF(day, ISNULL(MAX(o.EventDate), s.DateJoined), GETDATE()) AS DaysSinceLastOpen\nFROM [_Subscribers] s\nLEFT JOIN [_Open] o\n  ON s.SubscriberKey = o.SubscriberKey\nLEFT JOIN [_Click] c\n  ON s.SubscriberKey = c.SubscriberKey\nWHERE\n  s.Status = 'Active'\nGROUP BY\n  s.SubscriberKey,\n  s.EmailAddress,\n  s.FirstName,\n  s.DateJoined\nHAVING\n  DATEDIFF(day, ISNULL(MAX(o.EventDate), s.DateJoined), GETDATE()) BETWEEN 90 AND 365\nORDER BY DaysSinceLastOpen DESC`
    },
    {
      id: 'tmpl-xml-concat',
      name: '🔗 STUFF + FOR XML PATH',
      description: 'Concatenate multiple values into a comma-separated string (SFMC pattern)',
      sql: `SELECT\n  a.SubscriberKey,\n  a.EmailAddress,\n  STUFF((\n    SELECT ', ' + b.ProductName\n    FROM [Purchase_History] b\n    WHERE b.SubscriberKey = a.SubscriberKey\n    ORDER BY b.PurchaseDate DESC\n    FOR XML PATH('')\n  ), 1, 2, '') AS Products\nFROM [_Subscribers] a\nWHERE a.Status = 'Active'\nGROUP BY\n  a.SubscriberKey,\n  a.EmailAddress`
    }
  ];

  // ---------- Context-Aware Autocomplete Suggestions ----------
  const CONTEXT_SUGGESTIONS = {
    FROM: [
      { text: '[_Subscribers]', type: 'system DE', hint: 'All Subscribers system DE' },
      { text: '[_Open]', type: 'system DE', hint: 'Email Open tracking data' },
      { text: '[_Click]', type: 'system DE', hint: 'Email Click tracking data' },
      { text: '[_Bounce]', type: 'system DE', hint: 'Email Bounce data' },
      { text: '[_Sent]', type: 'system DE', hint: 'Email Send tracking data' },
      { text: '[_Unsubscribe]', type: 'system DE', hint: 'Unsubscribe tracking data' },
      { text: '[_Job]', type: 'system DE', hint: 'Email Job data' },
      { text: '[_Complaint]', type: 'system DE', hint: 'Spam Complaint data' },
      { text: '[_FTAF]', type: 'system DE', hint: 'Forward to a Friend data' },
      { text: '[_ListSubscribers]', type: 'system DE', hint: 'List subscriber memberships' },
      { text: '[_EnterpriseAttribute]', type: 'system DE', hint: 'Enterprise profile attributes' },
      { text: '[_MobileAddress]', type: 'system DE', hint: 'Mobile subscriber addresses' },
      { text: '[_MobilePush]', type: 'system DE', hint: 'Mobile push tracking data' },
      { text: '[_JourneyActivity]', type: 'system DE', hint: 'Journey Builder activity data' },
      { text: '[_Journey]', type: 'system DE', hint: 'Journey Builder journey data' },
      { text: '[dbo].[YourTableName]', type: 'pattern', hint: 'Custom DE with schema' }
    ],
    WHERE: [
      { text: "Status = 'Active'", type: 'condition', hint: 'Active subscribers only' },
      { text: 'EventDate >= DATEADD(day, -30, GETDATE())', type: 'condition', hint: 'Last 30 days' },
      { text: 'EventDate >= DATEADD(day, -7, GETDATE())', type: 'condition', hint: 'Last 7 days' },
      { text: 'EventDate >= DATEADD(month, -3, GETDATE())', type: 'condition', hint: 'Last 3 months' },
      { text: 'IsUnique = 1', type: 'condition', hint: 'Unique events only' },
      { text: 'SubscriberKey IS NOT NULL', type: 'condition', hint: 'Non-null subscriber keys' },
      { text: "EmailAddress LIKE '%@%.%'", type: 'condition', hint: 'Valid email pattern' },
      { text: 'LEN(LTRIM(RTRIM(EmailAddress))) > 0', type: 'condition', hint: 'Non-empty email' }
    ],
    SELECT: [
      { text: 'TOP 100', type: 'keyword', hint: 'Limit results (SFMC best practice)' },
      { text: 'DISTINCT', type: 'keyword', hint: 'Unique rows only' },
      { text: 'SubscriberKey', type: 'field', hint: 'Common subscriber identifier' },
      { text: 'EmailAddress', type: 'field', hint: 'Subscriber email' },
      { text: 'FirstName', type: 'field', hint: 'Subscriber first name' },
      { text: 'LastName', type: 'field', hint: 'Subscriber last name' },
      { text: 'Status', type: 'field', hint: 'Subscriber status' },
      { text: 'DateJoined', type: 'field', hint: 'Subscriber join date' },
      { text: 'COUNT(*) AS Total', type: 'aggregate', hint: 'Count all records' },
      { text: "COUNT(DISTINCT SubscriberKey) AS UniqueCount", type: 'aggregate', hint: 'Count unique subscribers' }
    ],
    'DATEADD(': [
      { text: 'day, -30, GETDATE())', type: 'param', hint: '30 days ago' },
      { text: 'day, -7, GETDATE())', type: 'param', hint: '7 days ago' },
      { text: 'day, -1, GETDATE())', type: 'param', hint: 'Yesterday' },
      { text: 'month, -1, GETDATE())', type: 'param', hint: '1 month ago' },
      { text: 'month, -3, GETDATE())', type: 'param', hint: '3 months ago' },
      { text: 'year, -1, GETDATE())', type: 'param', hint: '1 year ago' },
      { text: 'hour, -24, GETDATE())', type: 'param', hint: '24 hours ago' }
    ],
    'CONVERT(': [
      { text: 'VARCHAR(10), GETDATE(), 120)', type: 'param', hint: 'Date as YYYY-MM-DD' },
      { text: 'VARCHAR(19), GETDATE(), 120)', type: 'param', hint: 'DateTime YYYY-MM-DD HH:MM:SS' },
      { text: 'VARCHAR(50), FieldName)', type: 'param', hint: 'Field to VARCHAR' },
      { text: 'INT, FieldName)', type: 'param', hint: 'Field to INT' },
      { text: 'DATETIME, FieldName, 101)', type: 'param', hint: 'String to DateTime (MM/DD/YYYY)' },
      { text: 'DATE, GETDATE())', type: 'param', hint: 'Current date only (no time)' }
    ],
    'HASHBYTES(': [
      { text: "'SHA2_256', SubscriberKey)", type: 'param', hint: 'SHA-256 hash of SubscriberKey' },
      { text: "'SHA2_256', EmailAddress)", type: 'param', hint: 'SHA-256 hash of Email' },
      { text: "'MD5', SubscriberKey)", type: 'param', hint: 'MD5 hash (less secure)' }
    ],
    'DATEDIFF(': [
      { text: 'day, StartDate, GETDATE())', type: 'param', hint: 'Days between date and now' },
      { text: 'month, DateJoined, GETDATE())', type: 'param', hint: 'Months since joined' },
      { text: 'year, BirthDate, GETDATE())', type: 'param', hint: 'Age in years' },
      { text: 'hour, EventDate, GETDATE())', type: 'param', hint: 'Hours since event' }
    ]
  };

  // ---------- State ----------
  let isDarkMode = false;
  let editorInstance = null;
  let originalTextarea = null;
  let autocompleteEl = null;
  let autocompleteIndex = 0;
  let autocompleteItems = [];
  let fieldSidebarOpen = false;
  let explainPanelOpen = false;
  let validationErrors = [];
  let settings = {
    fontSize: 13,
    tabSize: 2,
    autoFormatOnPaste: false,
    showValidation: true,
    showExplain: true
  };

  // ---------- Detection ----------
  function isSFMCQueryPage() {
    const url = window.location.href.toLowerCase();
    const isQueryActivity =
      url.includes('queryactivity') ||
      url.includes('query') ||
      url.includes('automation') ||
      document.querySelector('[data-activity-type="queryactivity"]') !== null ||
      document.querySelector('.query-activity') !== null;
    const isSFMC =
      url.includes('exacttarget.com') ||
      url.includes('marketingcloudapps.com');
    return isSFMC && (isQueryActivity || findSQLTextarea());
  }

  function findSQLTextarea() {
    const selectors = [
      'textarea[name*="query" i]', 'textarea[name*="sql" i]',
      'textarea[id*="query" i]', 'textarea[id*="sql" i]',
      'textarea[class*="query" i]', 'textarea[class*="sql" i]',
      'textarea[data-bind*="query" i]', '.query-editor textarea',
      '.sql-editor textarea', '#queryText', '#sqlText',
      'textarea.x-form-textarea', '.x-form-text-wrap textarea'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    const allTextareas = document.querySelectorAll('textarea');
    let largest = null;
    let maxArea = 0;
    for (const ta of allTextareas) {
      const area = ta.offsetWidth * ta.offsetHeight;
      if (area > maxArea && area > 10000) {
        maxArea = area;
        largest = ta;
      }
    }
    return largest;
  }

  // ---------- SQL Formatter ----------
  function formatSQL(sql) {
    if (!sql || !sql.trim()) return sql;
    let formatted = sql.trim().replace(/\s+/g, ' ');

    const majorClauses = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN',
      'INNER JOIN', 'OUTER JOIN', 'FULL JOIN', 'CROSS JOIN',
      'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
      'ON', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING',
      'UNION ALL', 'UNION', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET',
      'DELETE FROM', 'WITH', 'LIMIT', 'OFFSET', 'CROSS APPLY',
      'OUTER APPLY'
    ];

    const sorted = majorClauses.sort((a, b) => b.length - a.length);

    for (const clause of sorted) {
      const regex = new RegExp(`\\b(${clause.replace(/ /g, '\\s+')})\\b`, 'gi');
      formatted = formatted.replace(regex, '\n' + clause.toUpperCase());
    }

    const lines = formatted.split('\n').filter(l => l.trim());
    const indentedLines = [];

    for (let line of lines) {
      line = line.trim();
      const upper = line.toUpperCase();
      let indent = 0;

      if (upper.startsWith('SELECT') || upper.startsWith('FROM') ||
          upper.startsWith('WHERE') || upper.startsWith('ORDER BY') ||
          upper.startsWith('GROUP BY') || upper.startsWith('HAVING') ||
          upper.startsWith('UNION') || upper.startsWith('INSERT') ||
          upper.startsWith('UPDATE') || upper.startsWith('DELETE') ||
          upper.startsWith('WITH')) {
        indent = 0;
      } else if (upper.startsWith('JOIN') || upper.startsWith('LEFT') ||
                 upper.startsWith('RIGHT') || upper.startsWith('INNER') ||
                 upper.startsWith('OUTER') || upper.startsWith('FULL') ||
                 upper.startsWith('CROSS')) {
        indent = 0;
      } else if (upper.startsWith('ON') || upper.startsWith('AND') ||
                 upper.startsWith('OR') || upper.startsWith('SET')) {
        indent = 1;
      } else {
        indent = 1;
      }

      indentedLines.push('  '.repeat(indent) + line);
    }

    return indentedLines.join('\n').trim();
  }

  // ---------- Syntax Highlighting ----------
  function highlightSQL(text) {
    if (!text) return '';

    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Multi-line comments
    html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="qsp-syn-comment">$1</span>');
    // Single-line comments
    html = html.replace(/(--[^\n]*)/g, '<span class="qsp-syn-comment">$1</span>');
    // Strings (single quotes)
    html = html.replace(/('(?:[^'\\]|\\.)*')/g, '<span class="qsp-syn-string">$1</span>');
    // Numbers
    html = html.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="qsp-syn-number">$1</span>');

    // SFMC-specific functions (highlighted in orange)
    const sfmcPattern = SFMC_FUNCTIONS.map(k => `\\b${k}\\b`).join('|');
    html = html.replace(
      new RegExp(`(${sfmcPattern})`, 'gi'),
      (match) => `<span class="qsp-syn-sfmc">${match.toUpperCase()}</span>`
    );

    // SQL keywords
    const kwPattern = SQL_KEYWORDS.map(k => `\\b${k}\\b`).join('|');
    html = html.replace(
      new RegExp(`(?<!<span class="qsp-syn-sfmc">)(${kwPattern})(?!</span>)`, 'gi'),
      (match) => `<span class="qsp-syn-keyword">${match.toUpperCase()}</span>`
    );

    // Brackets / table references like [TableName]
    html = html.replace(/(\[[^\]]*\])/g, '<span class="qsp-syn-table">$1</span>');

    // Operators
    html = html.replace(/([=!&lt;&gt;]+|[+\-*/%])/g, '<span class="qsp-syn-operator">$1</span>');

    // Parentheses
    html = html.replace(/([()])/g, '<span class="qsp-syn-bracket">$1</span>');

    return html;
  }

  // ---------- Line Numbers ----------
  function updateLineNumbers(textarea, lineNumberEl) {
    const lines = (textarea.value || '').split('\n');
    lineNumberEl.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
  }

  // ---------- Status Bar ----------
  function updateStatusBar(textarea, elements) {
    const text = textarea.value || '';
    const lines = text.split('\n').length;
    const chars = text.length;
    const pos = textarea.selectionStart;
    const beforeCursor = text.substring(0, pos);
    const currentLine = beforeCursor.split('\n').length;
    const currentCol = pos - beforeCursor.lastIndexOf('\n');

    elements.charCount.textContent = `${chars} chars`;
    elements.lineCount.textContent = `${lines} lines`;
    elements.cursorPos.textContent = `Ln ${currentLine}, Col ${currentCol}`;
  }

  // ---------- SQL Validation ----------
  function validateSQL(sql) {
    const errors = [];
    if (!sql || !sql.trim()) return errors;

    const upper = sql.toUpperCase();
    const lines = sql.split('\n');

    // Check for LIMIT (MySQL) instead of TOP (SQL Server/SFMC)
    if (/\bLIMIT\s+\d+/i.test(sql)) {
      errors.push({
        type: 'error',
        message: 'SFMC uses TOP, not LIMIT. Replace LIMIT N with SELECT TOP N.',
        severity: 'high'
      });
    }

    // Check for SELECT * (bad practice)
    if (/\bSELECT\s+\*/i.test(sql)) {
      errors.push({
        type: 'warning',
        message: 'Avoid SELECT * in SFMC — specify columns explicitly for better performance.',
        severity: 'medium'
      });
    }

    // Check for DELETE without WHERE
    if (/\bDELETE\b/i.test(sql) && !/\bDELETE\b[\s\S]*\bWHERE\b/i.test(sql)) {
      errors.push({
        type: 'error',
        message: '⚠️ DELETE without WHERE will remove ALL records! Add a WHERE clause.',
        severity: 'critical'
      });
    }

    // Check for subqueries missing TOP (SFMC requirement)
    const subqueryMatches = sql.match(/\(\s*SELECT\b/gi);
    if (subqueryMatches) {
      for (const match of subqueryMatches) {
        const idx = sql.indexOf(match);
        const afterSelect = sql.substring(idx).match(/\(\s*SELECT\s+(.*)/i);
        if (afterSelect && !/\bTOP\b/i.test(afterSelect[1].substring(0, 30)) &&
            !/\bDISTINCT\b/i.test(afterSelect[1].substring(0, 30))) {
          // Check if this is actually a subquery, not a CTE or simple expression
          if (!/\bIN\s*\(\s*SELECT/i.test(sql.substring(Math.max(0, idx - 10), idx + match.length)) &&
              !/\bFROM\s*\(\s*SELECT/i.test(sql.substring(Math.max(0, idx - 10), idx + match.length))) {
            // skip — not all subqueries need TOP
          } else if (/\bIN\s*\(\s*SELECT/i.test(sql.substring(Math.max(0, idx - 10), idx + match.length))) {
            // IN subqueries don't need TOP
          }
        }
      }
    }

    // Check for JOINs without ON
    const joinCount = (upper.match(/\bJOIN\b/g) || []).length;
    const onCount = (upper.match(/\bON\b/g) || []).length;
    if (joinCount > 0 && onCount < joinCount) {
      errors.push({
        type: 'error',
        message: `Found ${joinCount} JOIN(s) but only ${onCount} ON clause(s). Each JOIN needs an ON condition.`,
        severity: 'high'
      });
    }

    // Check matching parentheses
    let parenDepth = 0;
    for (const ch of sql) {
      if (ch === '(') parenDepth++;
      if (ch === ')') parenDepth--;
      if (parenDepth < 0) break;
    }
    if (parenDepth !== 0) {
      errors.push({
        type: 'error',
        message: `Mismatched parentheses — ${parenDepth > 0 ? parenDepth + ' unclosed' : Math.abs(parenDepth) + ' extra closing'}.`,
        severity: 'high'
      });
    }

    // Check for unaliased columns in JOINs
    if (joinCount > 0 && /\bSELECT\b/i.test(sql)) {
      const selectMatch = sql.match(/\bSELECT\b([\s\S]*?)\bFROM\b/i);
      if (selectMatch) {
        const selectCols = selectMatch[1];
        // Simple heuristic: if there are JOINs and columns aren't prefixed with alias.
        const cols = selectCols.split(',').map(c => c.trim());
        const unprefixed = cols.filter(c => {
          const clean = c.replace(/^(TOP\s+\d+\s+|DISTINCT\s+)/i, '').trim();
          return clean && !clean.includes('.') && !clean.includes('(') &&
                 !clean.includes('*') && !/\bAS\b/i.test(clean) &&
                 clean !== '*' && !/^\d+$/.test(clean) && !/^'/.test(clean);
        });
        if (unprefixed.length > 0) {
          errors.push({
            type: 'warning',
            message: `Some columns may need table aliases when using JOINs to avoid ambiguity.`,
            severity: 'low'
          });
        }
      }
    }

    // Check for missing semicolons at end (informational)
    if (sql.trim() && !sql.trim().endsWith(';')) {
      // This is actually fine in SFMC, so just info level
    }

    return errors;
  }

  // ---------- Query Explain Panel ----------
  function analyzeQuery(sql) {
    if (!sql || !sql.trim()) return null;

    const upper = sql.toUpperCase();
    const analysis = {
      type: 'UNKNOWN',
      tables: [],
      joins: [],
      conditions: 0,
      subqueries: 0,
      aggregations: [],
      windowFunctions: 0,
      complexity: 'simple',
      suggestions: []
    };

    // Determine query type
    if (/^\s*SELECT/i.test(sql)) analysis.type = 'SELECT';
    else if (/^\s*INSERT/i.test(sql)) analysis.type = 'INSERT';
    else if (/^\s*UPDATE/i.test(sql)) analysis.type = 'UPDATE';
    else if (/^\s*DELETE/i.test(sql)) analysis.type = 'DELETE';

    // Count tables
    const tableMatches = sql.match(/\bFROM\s+(\[?[\w.]+\]?)/gi) || [];
    const joinTableMatches = sql.match(/\bJOIN\s+(\[?[\w.]+\]?)/gi) || [];
    analysis.tables = [...tableMatches, ...joinTableMatches].map(t =>
      t.replace(/\b(FROM|JOIN)\s+/i, '').trim()
    );

    // Count joins
    const joinTypes = sql.match(/\b(INNER|LEFT|RIGHT|FULL|CROSS)\s+(OUTER\s+)?JOIN\b/gi) || [];
    const plainJoins = sql.match(/\bJOIN\b/gi) || [];
    analysis.joins = plainJoins.length;

    // Count conditions
    const andOr = (upper.match(/\b(AND|OR)\b/g) || []).length;
    analysis.conditions = andOr + (upper.includes('WHERE') ? 1 : 0);

    // Count subqueries
    analysis.subqueries = (sql.match(/\(\s*SELECT\b/gi) || []).length;

    // Aggregations
    const aggFuncs = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
    for (const fn of aggFuncs) {
      if (new RegExp(`\\b${fn}\\s*\\(`, 'i').test(sql)) {
        analysis.aggregations.push(fn);
      }
    }

    // Window functions
    analysis.windowFunctions = (sql.match(/\bOVER\s*\(/gi) || []).length;

    // Complexity scoring
    let score = 0;
    score += analysis.joins * 2;
    score += analysis.subqueries * 3;
    score += analysis.conditions;
    score += analysis.aggregations.length;
    score += analysis.windowFunctions * 2;

    if (score <= 3) analysis.complexity = 'simple';
    else if (score <= 8) analysis.complexity = 'medium';
    else analysis.complexity = 'complex';

    // Suggestions
    if (analysis.joins > 2 && !upper.includes('TOP')) {
      analysis.suggestions.push('Consider adding TOP to limit results with multiple JOINs.');
    }
    if (analysis.subqueries > 1) {
      analysis.suggestions.push('Multiple subqueries detected — consider using CTEs (WITH clause) for readability.');
    }
    if (analysis.joins > 0 && !upper.includes('INDEX')) {
      analysis.suggestions.push('Ensure JOIN columns are indexed in your Data Extensions for better performance.');
    }
    if (/\bSELECT\s+\*/i.test(sql)) {
      analysis.suggestions.push('Replace SELECT * with specific columns to reduce data transfer.');
    }
    if (analysis.complexity === 'complex') {
      analysis.suggestions.push('Complex query — test with TOP 10 first to verify logic before full execution.');
    }
    if (/\bLIKE\s+'%/i.test(sql)) {
      analysis.suggestions.push('Leading wildcard in LIKE prevents index usage — consider alternatives if performance is slow.');
    }

    return analysis;
  }

  // ---------- Smart Autocomplete ----------
  function getContextSuggestions(text, cursorPos) {
    const before = text.substring(0, cursorPos);
    const suggestions = [];

    // Check for function parameter context
    const funcParamContexts = ['DATEADD(', 'CONVERT(', 'HASHBYTES(', 'DATEDIFF('];
    for (const ctx of funcParamContexts) {
      const lastIdx = before.toUpperCase().lastIndexOf(ctx);
      if (lastIdx !== -1) {
        const afterFunc = before.substring(lastIdx + ctx.length);
        // Only if we haven't closed the parenthesis
        const openParens = (afterFunc.match(/\(/g) || []).length;
        const closeParens = (afterFunc.match(/\)/g) || []).length;
        if (openParens >= closeParens && afterFunc.trim() === '') {
          return (CONTEXT_SUGGESTIONS[ctx] || []).map(s => ({
            ...s, displayText: s.text, insertText: s.text
          }));
        }
      }
    }

    // Check keyword context
    const lastKeywordMatch = before.match(/\b(SELECT|FROM|JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|INNER\s+JOIN|WHERE)\s+$/i);
    if (lastKeywordMatch) {
      const keyword = lastKeywordMatch[1].toUpperCase().replace(/\s+/g, ' ');
      let contextKey = keyword;
      if (keyword.includes('JOIN')) contextKey = 'FROM'; // JOINs use same table suggestions
      const contextItems = CONTEXT_SUGGESTIONS[contextKey] || [];
      return contextItems.map(s => ({
        ...s, displayText: s.text, insertText: s.text
      }));
    }

    return null; // No context match — fall back to default autocomplete
  }

  function showAutocomplete(textarea, containerEl) {
    const text = textarea.value;
    const pos = textarea.selectionStart;

    // First try context-aware suggestions
    const contextMatches = getContextSuggestions(text, pos);
    if (contextMatches && contextMatches.length > 0) {
      renderAutocomplete(contextMatches, textarea, containerEl, '');
      return;
    }

    // Fall back to word-based matching
    const beforeCursor = text.substring(0, pos);
    const lastWord = beforeCursor.match(/[\w.]+$/);

    if (!lastWord || lastWord[0].length < 2) {
      hideAutocomplete();
      return;
    }

    const word = lastWord[0].toUpperCase();
    const matches = [];

    // Match keywords
    for (const kw of SQL_KEYWORDS) {
      if (kw.startsWith(word) && kw !== word) {
        matches.push({ displayText: kw, insertText: kw, type: 'keyword', hint: '' });
      }
    }

    // Match SFMC functions
    for (const fn of SFMC_FUNCTIONS) {
      if (fn.startsWith(word) && fn !== word) {
        matches.push({ displayText: fn, insertText: fn, type: 'sfmc', hint: '' });
      }
    }

    // Match function signatures
    for (const sig of SQL_FUNCTION_SIGS) {
      if (sig.text.toUpperCase().startsWith(word)) {
        matches.push({
          displayText: sig.text,
          insertText: sig.text,
          type: sig.type,
          hint: sig.hint
        });
      }
    }

    if (matches.length === 0) {
      hideAutocomplete();
      return;
    }

    renderAutocomplete(matches, textarea, containerEl, lastWord[0]);
  }

  function renderAutocomplete(matches, textarea, containerEl, currentWord) {
    if (!autocompleteEl) {
      autocompleteEl = document.createElement('div');
      autocompleteEl.className = 'qsp-autocomplete';
      containerEl.appendChild(autocompleteEl);
    }

    autocompleteEl.innerHTML = '';
    autocompleteIndex = 0;
    autocompleteItems = matches.slice(0, 12);

    autocompleteItems.forEach((match, i) => {
      const item = document.createElement('div');
      item.className = 'qsp-autocomplete-item' + (i === 0 ? ' active' : '');

      const typeClass = match.type === 'sfmc' ? 'qsp-ac-type-sfmc' :
                         match.type === 'system DE' ? 'qsp-ac-type-de' :
                         match.type === 'condition' ? 'qsp-ac-type-cond' :
                         match.type === 'param' ? 'qsp-ac-type-param' :
                         match.type === 'field' ? 'qsp-ac-type-field' :
                         'qsp-ac-type-kw';

      item.innerHTML = `
        <div class="qsp-ac-main">
          <span class="qsp-ac-text">${match.displayText}</span>
          ${match.hint ? `<span class="qsp-ac-hint">${match.hint}</span>` : ''}
        </div>
        <span class="qsp-ac-type ${typeClass}">${match.type}</span>
      `;
      item.addEventListener('click', () => {
        insertAutocomplete(textarea, currentWord, match.insertText);
        hideAutocomplete();
      });
      autocompleteEl.appendChild(item);
    });

    autocompleteEl.style.display = 'block';

    // Position near the caret
    const caretTop = getCaretTopPosition(textarea);
    autocompleteEl.style.left = '52px';
    autocompleteEl.style.top = `${Math.min(caretTop + 24, textarea.offsetHeight - 100)}px`;
  }

  function hideAutocomplete() {
    if (autocompleteEl) {
      autocompleteEl.style.display = 'none';
    }
    autocompleteItems = [];
  }

  function insertAutocomplete(textarea, currentWord, completion) {
    const pos = textarea.selectionStart;
    const before = textarea.value.substring(0, pos - currentWord.length);
    const after = textarea.value.substring(pos);
    textarea.value = before + completion + after;
    const newPos = pos - currentWord.length + completion.length;
    textarea.selectionStart = newPos;
    textarea.selectionEnd = newPos;
    textarea.dispatchEvent(new Event('input'));
    textarea.focus();
  }

  function getCaretTopPosition(textarea) {
    const text = textarea.value.substring(0, textarea.selectionStart);
    const lines = text.split('\n').length;
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
    return lines * lineHeight + 12;
  }

  // ---------- Snippets (Chrome storage) ----------
  async function getSnippets() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ qspSnippets: [] }, (data) => resolve(data.qspSnippets));
    });
  }

  async function saveSnippet(name, sql) {
    const snippets = await getSnippets();
    snippets.push({
      id: Date.now().toString(),
      name, sql,
      createdAt: new Date().toISOString()
    });
    return new Promise((resolve) => {
      chrome.storage.local.set({ qspSnippets: snippets }, resolve);
    });
  }

  async function deleteSnippet(id) {
    let snippets = await getSnippets();
    snippets = snippets.filter(s => s.id !== id);
    return new Promise((resolve) => {
      chrome.storage.local.set({ qspSnippets: snippets }, resolve);
    });
  }

  // ---------- Query History ----------
  async function addToHistory(sql) {
    return new Promise((resolve) => {
      chrome.storage.local.get({ qspHistory: [] }, (data) => {
        const history = data.qspHistory;
        const existing = history.findIndex(h => h.sql === sql);
        if (existing !== -1) history.splice(existing, 1);
        history.unshift({ sql, timestamp: new Date().toISOString() });
        if (history.length > 50) history.pop();
        chrome.storage.local.set({ qspHistory: history }, resolve);
      });
    });
  }

  // ---------- Toast ----------
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.qsp-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `qsp-toast qsp-toast-${type}`;
    toast.innerHTML = `
      <span class="qsp-toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}</span>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => toast.classList.add('qsp-toast-show'));
    setTimeout(() => {
      toast.classList.remove('qsp-toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ---------- Validation Panel ----------
  function renderValidation(errors, container) {
    const panel = container.querySelector('.qsp-validation-panel');
    if (!panel) return;

    if (errors.length === 0) {
      panel.innerHTML = `<div class="qsp-validation-ok">✓ No issues found</div>`;
      panel.className = 'qsp-validation-panel qsp-validation-ok-state';
      return;
    }

    panel.className = 'qsp-validation-panel qsp-validation-has-errors';
    panel.innerHTML = errors.map(e => `
      <div class="qsp-validation-item qsp-validation-${e.type}">
        <span class="qsp-val-icon">${e.type === 'error' ? '❌' : '⚠️'}</span>
        <span class="qsp-val-msg">${e.message}</span>
      </div>
    `).join('');
  }

  // ---------- Query Explain Panel ----------
  function renderExplainPanel(analysis, container) {
    const panel = container.querySelector('.qsp-explain-panel');
    if (!panel || !analysis) return;

    const complexityColors = {
      simple: '#2e844a',
      medium: '#dd7a01',
      complex: '#ea001e'
    };

    const complexityEmoji = {
      simple: '🟢',
      medium: '🟡',
      complex: '🔴'
    };

    panel.innerHTML = `
      <div class="qsp-explain-header">
        <h4>📊 Query Analysis</h4>
        <span class="qsp-explain-complexity" style="color:${complexityColors[analysis.complexity]}">
          ${complexityEmoji[analysis.complexity]} ${analysis.complexity.toUpperCase()}
        </span>
      </div>
      <div class="qsp-explain-body">
        <div class="qsp-explain-grid">
          <div class="qsp-explain-stat">
            <span class="qsp-explain-stat-label">Type</span>
            <span class="qsp-explain-stat-value">${analysis.type}</span>
          </div>
          <div class="qsp-explain-stat">
            <span class="qsp-explain-stat-label">Tables</span>
            <span class="qsp-explain-stat-value">${analysis.tables.length}</span>
          </div>
          <div class="qsp-explain-stat">
            <span class="qsp-explain-stat-label">JOINs</span>
            <span class="qsp-explain-stat-value">${analysis.joins}</span>
          </div>
          <div class="qsp-explain-stat">
            <span class="qsp-explain-stat-label">Subqueries</span>
            <span class="qsp-explain-stat-value">${analysis.subqueries}</span>
          </div>
          <div class="qsp-explain-stat">
            <span class="qsp-explain-stat-label">Conditions</span>
            <span class="qsp-explain-stat-value">${analysis.conditions}</span>
          </div>
          <div class="qsp-explain-stat">
            <span class="qsp-explain-stat-label">Window Funcs</span>
            <span class="qsp-explain-stat-value">${analysis.windowFunctions}</span>
          </div>
        </div>
        ${analysis.tables.length > 0 ? `
          <div class="qsp-explain-section">
            <div class="qsp-explain-section-title">Tables Referenced</div>
            <div class="qsp-explain-tags">${analysis.tables.map(t => `<span class="qsp-explain-tag">${t}</span>`).join('')}</div>
          </div>
        ` : ''}
        ${analysis.aggregations.length > 0 ? `
          <div class="qsp-explain-section">
            <div class="qsp-explain-section-title">Aggregations</div>
            <div class="qsp-explain-tags">${analysis.aggregations.map(a => `<span class="qsp-explain-tag qsp-explain-tag-func">${a}</span>`).join('')}</div>
          </div>
        ` : ''}
        ${analysis.suggestions.length > 0 ? `
          <div class="qsp-explain-section">
            <div class="qsp-explain-section-title">💡 Suggestions</div>
            ${analysis.suggestions.map(s => `<div class="qsp-explain-suggestion">${s}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  // ---------- Field Reference Sidebar ----------
  function createFieldSidebar() {
    const sidebar = document.createElement('div');
    sidebar.className = 'qsp-field-sidebar';
    sidebar.id = 'qsp-field-sidebar';
    sidebar.innerHTML = `
      <div class="qsp-field-sidebar-header">
        <h4>📋 Field Reference</h4>
        <button class="qsp-btn qsp-btn-icon" id="qsp-close-sidebar" style="background:transparent;border:none;color:#fff;font-size:18px;cursor:pointer;">✕</button>
      </div>
      <div class="qsp-field-search">
        <input type="text" id="qsp-field-search-input" placeholder="Enter Data Extension name...">
      </div>
      <div class="qsp-field-list" id="qsp-field-list">
        <div class="qsp-field-info">
          <p><strong>SFMC System Data Views:</strong></p>
          <div class="qsp-field-quickref">
            ${CONTEXT_SUGGESTIONS.FROM.filter(s => s.type === 'system DE').map(s => `
              <div class="qsp-field-quickref-item" title="${s.hint}">
                <code>${s.text}</code>
                <small>${s.hint}</small>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(sidebar);

    document.getElementById('qsp-close-sidebar').addEventListener('click', () => {
      sidebar.classList.remove('open');
      fieldSidebarOpen = false;
    });

    return sidebar;
  }

  // ---------- Templates Modal ----------
  function showTemplatesModal(editor) {
    const overlay = document.createElement('div');
    overlay.className = 'qsp-modal-overlay';

    const templatesHTML = SFMC_TEMPLATES.map(t => `
      <div class="qsp-template-item" data-id="${t.id}">
        <div class="qsp-template-header">
          <span class="qsp-template-name">${t.name}</span>
        </div>
        <div class="qsp-template-desc">${t.description}</div>
        <div class="qsp-template-preview"><code>${t.sql.substring(0, 80)}...</code></div>
        <div class="qsp-template-actions">
          <button class="qsp-btn qsp-btn-sm qsp-template-use" data-id="${t.id}">📥 Use</button>
          <button class="qsp-btn qsp-btn-sm qsp-template-copy" data-id="${t.id}">📋 Copy</button>
        </div>
      </div>
    `).join('');

    overlay.innerHTML = `
      <div class="qsp-modal qsp-modal-lg">
        <div class="qsp-modal-header">
          <h3>📋 SFMC Query Templates</h3>
          <button class="qsp-modal-close" id="qsp-templates-close">✕</button>
        </div>
        <div class="qsp-modal-search">
          <input type="text" class="qsp-modal-input" id="qsp-template-search" placeholder="Search templates...">
        </div>
        <div class="qsp-template-list" id="qsp-template-list">${templatesHTML}</div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    document.getElementById('qsp-templates-close').addEventListener('click', () => overlay.remove());

    // Search filter
    document.getElementById('qsp-template-search').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll('.qsp-template-item').forEach(item => {
        const template = SFMC_TEMPLATES.find(t => t.id === item.dataset.id);
        const match = template.name.toLowerCase().includes(q) ||
                      template.description.toLowerCase().includes(q) ||
                      template.sql.toLowerCase().includes(q);
        item.style.display = match ? '' : 'none';
      });
    });

    // Use template
    overlay.querySelectorAll('.qsp-template-use').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const template = SFMC_TEMPLATES.find(t => t.id === btn.dataset.id);
        if (template) {
          editor.value = template.sql;
          editor.dispatchEvent(new Event('input'));
          syncToOriginal(editor);
          showToast(`Template loaded: ${template.name}`, 'success');
          overlay.remove();
        }
      });
    });

    // Copy template
    overlay.querySelectorAll('.qsp-template-copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const template = SFMC_TEMPLATES.find(t => t.id === btn.dataset.id);
        if (template) {
          navigator.clipboard.writeText(template.sql);
          btn.textContent = '✅ Copied';
          setTimeout(() => btn.textContent = '📋 Copy', 1500);
        }
      });
    });
  }

  // ---------- Save Snippet Modal ----------
  function showSaveModal(currentSQL) {
    const overlay = document.createElement('div');
    overlay.className = 'qsp-modal-overlay';
    overlay.innerHTML = `
      <div class="qsp-modal">
        <div class="qsp-modal-header">
          <h3>💾 Save Query Snippet</h3>
          <button class="qsp-modal-close" id="qsp-save-close">✕</button>
        </div>
        <input type="text" class="qsp-modal-input" id="qsp-snippet-name" placeholder="Snippet name..." autofocus>
        <textarea class="qsp-modal-input qsp-modal-textarea" id="qsp-snippet-sql" rows="8">${currentSQL}</textarea>
        <div class="qsp-modal-actions">
          <button class="qsp-btn" id="qsp-modal-cancel">Cancel</button>
          <button class="qsp-btn qsp-btn-primary" id="qsp-modal-save">Save Snippet</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('qsp-save-close').addEventListener('click', () => overlay.remove());
    document.getElementById('qsp-modal-cancel').addEventListener('click', () => overlay.remove());

    document.getElementById('qsp-modal-save').addEventListener('click', async () => {
      const name = document.getElementById('qsp-snippet-name').value.trim();
      const sql = document.getElementById('qsp-snippet-sql').value.trim();
      if (!name) { showToast('Please enter a snippet name', 'error'); return; }
      await saveSnippet(name, sql);
      showToast('Snippet saved!', 'success');
      overlay.remove();
    });

    document.getElementById('qsp-snippet-name').focus();
  }

  // ---------- Load Snippets Modal ----------
  async function showLoadModal(editor) {
    const snippets = await getSnippets();
    const overlay = document.createElement('div');
    overlay.className = 'qsp-modal-overlay';

    let snippetHTML;
    if (snippets.length === 0) {
      snippetHTML = '<div class="qsp-empty-state"><div class="qsp-empty-icon">📝</div><p>No snippets saved yet.</p></div>';
    } else {
      snippetHTML = snippets.map(s => `
        <div class="qsp-snippet-item" data-id="${s.id}">
          <div class="qsp-snippet-info">
            <div class="qsp-snippet-name">${s.name}</div>
            <div class="qsp-snippet-preview">${s.sql.substring(0, 100)}...</div>
          </div>
          <div class="qsp-snippet-actions">
            <button class="qsp-btn qsp-btn-sm qsp-snippet-use" data-sql="${encodeURIComponent(s.sql)}" title="Use">📥</button>
            <button class="qsp-btn qsp-btn-sm qsp-snippet-del" data-id="${s.id}" title="Delete">🗑️</button>
          </div>
        </div>
      `).join('');
    }

    overlay.innerHTML = `
      <div class="qsp-modal">
        <div class="qsp-modal-header">
          <h3>📚 Saved Snippets (${snippets.length})</h3>
          <button class="qsp-modal-close" id="qsp-snippets-close">✕</button>
        </div>
        <div class="qsp-snippet-list">${snippetHTML}</div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('qsp-snippets-close').addEventListener('click', () => overlay.remove());

    overlay.querySelectorAll('.qsp-snippet-use').forEach(btn => {
      btn.addEventListener('click', () => {
        const sql = decodeURIComponent(btn.dataset.sql);
        editor.value = sql;
        editor.dispatchEvent(new Event('input'));
        syncToOriginal(editor);
        showToast('Snippet loaded!', 'success');
        overlay.remove();
      });
    });

    overlay.querySelectorAll('.qsp-snippet-del').forEach(btn => {
      btn.addEventListener('click', async () => {
        await deleteSnippet(btn.dataset.id);
        showToast('Snippet deleted', 'info');
        overlay.remove();
        showLoadModal(editor);
      });
    });
  }

  // ---------- Sync to Original Textarea ----------
  function syncToOriginal(editor) {
    if (originalTextarea && originalTextarea !== editor) {
      originalTextarea.value = editor.value;
      originalTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      originalTextarea.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  // ---------- Build Enhanced Editor ----------
  function buildEditor(textarea) {
    originalTextarea = textarea;
    const currentSQL = textarea.value || '';

    // Create container
    const container = document.createElement('div');
    container.className = 'qsp-editor-container';
    container.id = 'qsp-editor-container';

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'qsp-toolbar';
    toolbar.innerHTML = `
      <div class="qsp-toolbar-group">
        <span class="qsp-brand">⚡ Query Studio Pro</span>
        <span class="qsp-version">v2.0</span>
      </div>
      <div class="qsp-toolbar-sep"></div>
      <div class="qsp-toolbar-group">
        <button class="qsp-btn qsp-btn-toolbar" id="qsp-format" title="Format SQL (Cmd+Shift+F)">
          <span class="qsp-btn-icon-inner">🎨</span> Format
        </button>
        <button class="qsp-btn qsp-btn-toolbar" id="qsp-copy" title="Copy to clipboard">
          <span class="qsp-btn-icon-inner">📋</span> Copy
        </button>
      </div>
      <div class="qsp-toolbar-sep"></div>
      <div class="qsp-toolbar-group">
        <button class="qsp-btn qsp-btn-toolbar" id="qsp-save-snippet" title="Save as snippet (Cmd+Shift+S)">
          <span class="qsp-btn-icon-inner">💾</span> Save
        </button>
        <button class="qsp-btn qsp-btn-toolbar" id="qsp-load-snippet" title="Load snippet">
          <span class="qsp-btn-icon-inner">📚</span> Snippets
        </button>
        <button class="qsp-btn qsp-btn-toolbar" id="qsp-templates" title="SFMC query templates">
          <span class="qsp-btn-icon-inner">📋</span> Templates
        </button>
      </div>
      <div class="qsp-toolbar-sep"></div>
      <div class="qsp-toolbar-group">
        <button class="qsp-btn qsp-btn-toolbar" id="qsp-explain-toggle" title="Query Analysis">
          <span class="qsp-btn-icon-inner">📊</span> Explain
        </button>
        <button class="qsp-btn qsp-btn-toolbar" id="qsp-fields" title="Field reference sidebar">
          <span class="qsp-btn-icon-inner">🗂️</span> Fields
        </button>
        <button class="qsp-btn qsp-btn-toolbar qsp-btn-icon-only" id="qsp-darkmode" title="Toggle dark mode">🌙</button>
      </div>
    `;

    // Editor wrapper
    const editorWrapper = document.createElement('div');
    editorWrapper.className = 'qsp-editor-wrapper';

    const lineNumbers = document.createElement('div');
    lineNumbers.className = 'qsp-line-numbers';

    const editor = document.createElement('textarea');
    editor.className = 'qsp-editor';
    editor.value = currentSQL;
    editor.spellcheck = false;
    editor.placeholder = '-- Write your SFMC SQL query here\nSELECT ... FROM ... WHERE ...';

    const highlightLayer = document.createElement('div');
    highlightLayer.className = 'qsp-highlight-layer';

    editorWrapper.appendChild(lineNumbers);
    editorWrapper.appendChild(highlightLayer);
    editorWrapper.appendChild(editor);

    // Validation panel
    const validationPanel = document.createElement('div');
    validationPanel.className = 'qsp-validation-panel';

    // Explain panel (collapsible)
    const explainPanel = document.createElement('div');
    explainPanel.className = 'qsp-explain-panel qsp-explain-collapsed';

    // Status bar
    const statusbar = document.createElement('div');
    statusbar.className = 'qsp-statusbar';
    statusbar.innerHTML = `
      <div class="qsp-statusbar-left">
        <span id="qsp-cursor-pos">Ln 1, Col 1</span>
        <span class="qsp-statusbar-sep">|</span>
        <span id="qsp-line-count">0 lines</span>
        <span class="qsp-statusbar-sep">|</span>
        <span id="qsp-char-count">0 chars</span>
      </div>
      <div class="qsp-statusbar-right">
        <span class="qsp-statusbar-hint">⌘⇧F Format</span>
        <span class="qsp-statusbar-hint">⌘⇧S Save</span>
        <span class="qsp-statusbar-hint">SQL Server</span>
      </div>
    `;

    // Assemble
    container.appendChild(toolbar);
    container.appendChild(editorWrapper);
    container.appendChild(validationPanel);
    container.appendChild(explainPanel);
    container.appendChild(statusbar);

    // Replace original textarea
    textarea.style.display = 'none';
    textarea.parentNode.insertBefore(container, textarea);

    editorInstance = editor;

    // ---------- Status elements ----------
    const statusElements = {
      charCount: statusbar.querySelector('#qsp-char-count'),
      lineCount: statusbar.querySelector('#qsp-line-count'),
      cursorPos: statusbar.querySelector('#qsp-cursor-pos')
    };

    // ---------- Debounced validation ----------
    let validationTimer = null;
    function debouncedValidate() {
      clearTimeout(validationTimer);
      validationTimer = setTimeout(() => {
        const errors = validateSQL(editor.value);
        renderValidation(errors, container);
      }, 500);
    }

    let explainTimer = null;
    function debouncedExplain() {
      if (!explainPanelOpen) return;
      clearTimeout(explainTimer);
      explainTimer = setTimeout(() => {
        const analysis = analyzeQuery(editor.value);
        renderExplainPanel(analysis, container);
      }, 800);
    }

    // ---------- Event Handlers ----------
    editor.addEventListener('input', () => {
      updateLineNumbers(editor, lineNumbers);
      updateStatusBar(editor, statusElements);
      highlightLayer.innerHTML = highlightSQL(editor.value);
      syncToOriginal(editor);
      showAutocomplete(editor, editorWrapper);
      debouncedValidate();
      debouncedExplain();
    });

    editor.addEventListener('click', () => {
      updateStatusBar(editor, statusElements);
    });

    editor.addEventListener('scroll', () => {
      lineNumbers.scrollTop = editor.scrollTop;
      highlightLayer.scrollTop = editor.scrollTop;
      highlightLayer.scrollLeft = editor.scrollLeft;
    });

    // Paste handling
    editor.addEventListener('paste', (e) => {
      if (settings.autoFormatOnPaste) {
        setTimeout(() => {
          editor.value = formatSQL(editor.value);
          editor.dispatchEvent(new Event('input'));
          syncToOriginal(editor);
        }, 50);
      }
    });

    // Keyboard handling
    editor.addEventListener('keydown', (e) => {
      // Tab key
      if (e.key === 'Tab' && !autocompleteEl?.style.display?.includes('block')) {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const indent = ' '.repeat(settings.tabSize);
        editor.value = editor.value.substring(0, start) + indent + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + settings.tabSize;
        editor.dispatchEvent(new Event('input'));
      }

      // Autocomplete navigation
      if (autocompleteEl && autocompleteEl.style.display !== 'none' && autocompleteItems.length > 0) {
        const items = autocompleteEl.querySelectorAll('.qsp-autocomplete-item');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          items[autocompleteIndex]?.classList.remove('active');
          autocompleteIndex = (autocompleteIndex + 1) % items.length;
          items[autocompleteIndex]?.classList.add('active');
          items[autocompleteIndex]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          items[autocompleteIndex]?.classList.remove('active');
          autocompleteIndex = (autocompleteIndex - 1 + items.length) % items.length;
          items[autocompleteIndex]?.classList.add('active');
          items[autocompleteIndex]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          const active = autocompleteEl.querySelector('.active');
          if (active) {
            e.preventDefault();
            active.click();
          }
        } else if (e.key === 'Escape') {
          hideAutocomplete();
        }
      }

      // Format shortcut
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        editor.value = formatSQL(editor.value);
        editor.dispatchEvent(new Event('input'));
        syncToOriginal(editor);
        showToast('SQL formatted!', 'success');
      }

      // Save snippet shortcut
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        showSaveModal(editor.value);
      }

      // Auto-close brackets
      if (e.key === '(') {
        const pos = editor.selectionStart;
        const before = editor.value.substring(0, pos);
        const after = editor.value.substring(editor.selectionEnd);
        editor.value = before + '()' + after;
        editor.selectionStart = editor.selectionEnd = pos + 1;
        e.preventDefault();
        editor.dispatchEvent(new Event('input'));
      }

      // Auto-close quotes
      if (e.key === "'") {
        const pos = editor.selectionStart;
        const after = editor.value.substring(editor.selectionEnd);
        if (after.charAt(0) === "'") {
          // Skip over existing closing quote
          editor.selectionStart = editor.selectionEnd = pos + 1;
          e.preventDefault();
        } else {
          const before = editor.value.substring(0, pos);
          editor.value = before + "''" + after;
          editor.selectionStart = editor.selectionEnd = pos + 1;
          e.preventDefault();
          editor.dispatchEvent(new Event('input'));
        }
      }
    });

    editor.addEventListener('blur', () => {
      setTimeout(hideAutocomplete, 200);
      if (editor.value.trim()) addToHistory(editor.value.trim());
    });

    // ---------- Toolbar Buttons ----------
    document.getElementById('qsp-format').addEventListener('click', () => {
      editor.value = formatSQL(editor.value);
      editor.dispatchEvent(new Event('input'));
      syncToOriginal(editor);
      showToast('SQL formatted!', 'success');
    });

    document.getElementById('qsp-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(editor.value).then(() => {
        showToast('Copied to clipboard!', 'success');
      });
    });

    document.getElementById('qsp-save-snippet').addEventListener('click', () => {
      showSaveModal(editor.value);
    });

    document.getElementById('qsp-load-snippet').addEventListener('click', () => {
      showLoadModal(editor);
    });

    document.getElementById('qsp-templates').addEventListener('click', () => {
      showTemplatesModal(editor);
    });

    document.getElementById('qsp-explain-toggle').addEventListener('click', () => {
      explainPanelOpen = !explainPanelOpen;
      explainPanel.classList.toggle('qsp-explain-collapsed', !explainPanelOpen);
      if (explainPanelOpen) {
        const analysis = analyzeQuery(editor.value);
        renderExplainPanel(analysis, container);
      }
    });

    document.getElementById('qsp-fields').addEventListener('click', () => {
      let sidebar = document.getElementById('qsp-field-sidebar');
      if (!sidebar) sidebar = createFieldSidebar();
      fieldSidebarOpen = !fieldSidebarOpen;
      sidebar.classList.toggle('open', fieldSidebarOpen);
    });

    document.getElementById('qsp-darkmode').addEventListener('click', () => {
      isDarkMode = !isDarkMode;
      container.classList.toggle('qsp-dark', isDarkMode);
      const sidebar = document.getElementById('qsp-field-sidebar');
      if (sidebar) sidebar.classList.toggle('qsp-dark', isDarkMode);
      chrome.storage.local.set({ qspDarkMode: isDarkMode });
      showToast(isDarkMode ? 'Dark mode enabled' : 'Light mode enabled');
    });

    // Load preferences
    chrome.storage.local.get({
      qspDarkMode: false,
      qspSettings: settings
    }, (data) => {
      isDarkMode = data.qspDarkMode;
      settings = { ...settings, ...data.qspSettings };
      container.classList.toggle('qsp-dark', isDarkMode);
      editor.style.fontSize = settings.fontSize + 'px';
      highlightLayer.style.fontSize = settings.fontSize + 'px';
      lineNumbers.style.fontSize = settings.fontSize + 'px';
    });

    // Initial render
    updateLineNumbers(editor, lineNumbers);
    updateStatusBar(editor, statusElements);
    highlightLayer.innerHTML = highlightSQL(editor.value);
    debouncedValidate();

    return editor;
  }

  // ---------- Initialize ----------
  function init() {
    const textarea = findSQLTextarea();
    if (textarea && !document.getElementById('qsp-editor-container')) {
      console.log('[Query Studio Pro v2.0] Enhancing SQL editor...');
      buildEditor(textarea);
    }
  }

  // Watch for dynamic content (SFMC is SPA-based)
  const observer = new MutationObserver(() => {
    if (!document.getElementById('qsp-editor-container')) {
      const textarea = findSQLTextarea();
      if (textarea) init();
    }
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }

  setTimeout(init, 1500);
  setTimeout(init, 3000);
  setTimeout(init, 5000);

  // Listen for commands from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'format-sql' && editorInstance) {
      editorInstance.value = formatSQL(editorInstance.value);
      editorInstance.dispatchEvent(new Event('input'));
      syncToOriginal(editorInstance);
      showToast('SQL formatted!', 'success');
    } else if (msg.action === 'save-snippet' && editorInstance) {
      showSaveModal(editorInstance.value);
    }
  });
})();
