// Type definitions for the GitHub GraphQL API response
export type GitHubContributions = {
    totalCommitContributions: number;
    commitContributionsByRepository: Array<{
        repository: {
            nameWithOwner: string;
            isPrivate: boolean;
        };
        contributions: {
            totalCount: number;
        };
    }>;
};

// Return type for the GitHub activity API
export type Activity = {
    totalCommits: number;
    publicRepositories: Array<{
        name: string;
        commits: number;
    }>;
    privateCommits: number;
};

// API response type for the GitHub GraphQL API
type GitHubResponse = {
    data?: {
        viewer?: {
            contributionsCollection?: GitHubContributions;
        };
    };
    errors?: Array<{
        message: string;
    }>;
};

// Github GraphQL query
const ACTIVITY_QUERY = `
    query Activity($from: DateTime!, $to: DateTime!) {
        viewer {
            contributionsCollection(from: $from, to: $to) {
                totalCommitContributions
                commitContributionsByRepository(maxRepositories: 100) {
                    repository {
                        nameWithOwner
                        isPrivate
                    }
                    contributions {
                        totalCount
                    }
                }
            }
        }
    }
`;

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function fetchActivity(
    now = new Date(),
): Promise<Activity> {
    const to = now.toISOString();
    const from = new Date(now.getTime() - SEVEN_DAYS_MS).toISOString();

    const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
            accept: "application/vnd.github+json",
            authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            "content-type": "application/json",
            "user-agent": "github-activity-monitor",
        },
        body: JSON.stringify({
            query: ACTIVITY_QUERY,
            variables: { from, to },
        }),
    });

    if (!response.ok) {
        throw new Error(`GitHub request failed with ${response.status}`);
    }

    const payload = await response.json() as GitHubResponse;

    if (payload.errors?.length) {
        throw new Error(`GitHub GraphQL error: ${payload.errors[0]?.message}`);
    }

    const contributions =
        payload.data?.viewer?.contributionsCollection;

    if (!contributions) {
        throw new Error("GitHub response contained no contribution data");
    }

    return toActivity(contributions);
}

export function toActivity(
    contributions: GitHubContributions,
): Activity {
    const publicRepositories = contributions
        .commitContributionsByRepository
        .filter(({ repository }) => !repository.isPrivate)
        .map(({ repository, contributions }) => ({
            name: repository.nameWithOwner,
            commits: contributions.totalCount,
        }));

    const publicCommits = publicRepositories.reduce(
        (total, repository) => total + repository.commits,
        0,
    );

    const privateCommits = Math.max(
        0,
        contributions.totalCommitContributions - publicCommits,
    );

    return {
        totalCommits: contributions.totalCommitContributions,
        publicRepositories,
        privateCommits,
    };
}