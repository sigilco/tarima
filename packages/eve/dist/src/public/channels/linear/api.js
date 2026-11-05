import{isObject}from"#shared/guards.js";import{parseJsonObject}from"#shared/json.js";import{resolveLinearAccessToken}from"#public/channels/linear/auth.js";const AGENT_SESSION_FIELDS=`
  fragment AgentSessionFields on AgentSession {
    id
    appUser { id }
    comment { id }
    creator { id }
    issue { id identifier title url }
    sourceComment { id }
    status
    url
  }
`;var LinearApiError=class extends Error{body;queryName;status;constructor(e){super(`Linear GraphQL ${e.queryName} failed with HTTP ${e.status}.`),this.name=`LinearApiError`,this.body=e.body,this.queryName=e.queryName,this.status=e.status}};async function callLinearGraphQL(e){let t=e.api?.fetch??fetch,n=await resolveLinearAccessToken(e.credentials?.accessToken),r=await t(e.api?.apiBaseUrl??`https://api.linear.app/graphql`,{body:JSON.stringify({query:e.query,variables:e.variables??{}}),headers:{authorization:`Bearer ${n}`,"content-type":`application/json; charset=utf-8`},method:`POST`}),i=await parseResponseBody(r);if(!r.ok||hasGraphQLErrors(i)||!isObject(i)||!isObject(i.data))throw new LinearApiError({body:i,queryName:e.queryName,status:r.status});return i.data}async function createLinearAgentActivity(e){let t=(await callLinearGraphQL({api:e.api,credentials:e.credentials,query:`
      mutation AgentActivityCreate($input: AgentActivityCreateInput!) {
        agentActivityCreate(input: $input) {
          success
          agentActivity { id }
        }
      }
    `,queryName:`AgentActivityCreate`,variables:{input:parseJsonObject(e.activity)}})).agentActivityCreate,n=t?.agentActivity?.id;return{id:typeof n==`string`?n:``,success:t?.success===!0}}async function updateLinearAgentSession(e){return{success:(await callLinearGraphQL({api:e.api,credentials:e.credentials,query:`
      mutation AgentSessionUpdate($id: String!, $input: AgentSessionUpdateInput!) {
        agentSessionUpdate(id: $id, input: $input) {
          success
        }
      }
    `,queryName:`AgentSessionUpdate`,variables:{id:e.id,input:parseJsonObject(e.update)}})).agentSessionUpdate?.success===!0}}async function createLinearAgentSessionOnIssue(e){return normalizeAgentSessionRecord((await callLinearGraphQL({api:e.api,credentials:e.credentials,query:`
      mutation AgentSessionCreateOnIssue($input: AgentSessionCreateOnIssue!) {
        agentSessionCreateOnIssue(input: $input) {
          success
          agentSession {
            ...AgentSessionFields
          }
        }
      }
      ${AGENT_SESSION_FIELDS}
    `,queryName:`AgentSessionCreateOnIssue`,variables:{input:parseJsonObject({externalLink:e.externalLink,externalUrls:e.externalUrls,issueId:e.issueId})}})).agentSessionCreateOnIssue?.agentSession)}async function createLinearAgentSessionOnComment(e){return normalizeAgentSessionRecord((await callLinearGraphQL({api:e.api,credentials:e.credentials,query:`
      mutation AgentSessionCreateOnComment($input: AgentSessionCreateOnComment!) {
        agentSessionCreateOnComment(input: $input) {
          success
          agentSession {
            ...AgentSessionFields
          }
        }
      }
      ${AGENT_SESSION_FIELDS}
    `,queryName:`AgentSessionCreateOnComment`,variables:{input:parseJsonObject({commentId:e.commentId,externalLink:e.externalLink,externalUrls:e.externalUrls})}})).agentSessionCreateOnComment?.agentSession)}async function listLinearAgentSessionActivities(e){let t=(await callLinearGraphQL({api:e.api,credentials:e.credentials,query:`
      query AgentSessionActivities($id: String!, $last: Int!) {
        agentSession(id: $id) {
          activities(last: $last) {
            nodes {
              id
              signal
              signalMetadata
              updatedAt
              content {
                __typename
                ... on AgentActivityElicitationContent { body type }
                ... on AgentActivityPromptContent { body type }
                ... on AgentActivityResponseContent { body type }
                ... on AgentActivityThoughtContent { body type }
                ... on AgentActivityErrorContent { body type }
              }
            }
          }
        }
      }
    `,queryName:`AgentSessionActivities`,variables:{id:e.agentSessionId,last:e.last??20}})).agentSession?.activities?.nodes;return Array.isArray(t)?t.map(normalizeAgentActivityRecord).filter(notNull):[]}function normalizeAgentSessionRecord(e){if(!isObject(e)||typeof e.id!=`string`)throw Error(`linearChannel: Linear Agent Session response was malformed.`);let t=normalizeIssue(e.issue),n={id:e.id},r=relationId(e.appUser);typeof r==`string`&&(n.appUserId=r);let i=relationId(e.comment);i!==void 0&&(n.commentId=i);let a=relationId(e.creator);a!==void 0&&(n.creatorId=a),t!==void 0&&(n.issue=t);let o=relationId(e.issue);o!==void 0&&(n.issueId=o);let s=relationId(e.sourceComment);return s!==void 0&&(n.sourceCommentId=s),typeof e.status==`string`&&(n.status=e.status),(typeof e.url==`string`||e.url===null)&&(n.url=e.url),n}function relationId(e){if(e===null)return null;if(isObject(e)&&typeof e.id==`string`)return e.id}function normalizeAgentActivityRecord(e){if(!isObject(e)||typeof e.id!=`string`||!isObject(e.content))return null;let t={};typeof e.content.body==`string`&&(t.body=e.content.body),typeof e.content.type==`string`&&(t.type=e.content.type),typeof e.content.__typename==`string`&&(t.__typename=e.content.__typename);let n={content:t,id:e.id};return(typeof e.signal==`string`||e.signal===null)&&(n.signal=e.signal),isObject(e.signalMetadata)&&(n.signalMetadata=parseJsonObject(e.signalMetadata)),e.signalMetadata===null&&(n.signalMetadata=null),typeof e.updatedAt==`string`&&(n.updatedAt=e.updatedAt),n}function normalizeIssue(e){if(e===null)return null;if(!isObject(e)||typeof e.id!=`string`)return;let t={id:e.id};return typeof e.identifier==`string`&&(t.identifier=e.identifier),typeof e.title==`string`&&(t.title=e.title),typeof e.url==`string`&&(t.url=e.url),t}async function parseResponseBody(e){let t=await e.text();if(!t)return null;try{return JSON.parse(t)}catch{return t}}function hasGraphQLErrors(e){return isObject(e)&&Array.isArray(e.errors)&&e.errors.length>0}function notNull(e){return e!==null}export{LinearApiError,callLinearGraphQL,createLinearAgentActivity,createLinearAgentSessionOnComment,createLinearAgentSessionOnIssue,listLinearAgentSessionActivities,updateLinearAgentSession};