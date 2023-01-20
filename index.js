const axios = require('axios');

const gitlabCredentials = {
  token: 'your_gitlab_token',
  host: 'https://gitlab.com'
};

const githubCredentials = {
  token: 'your_github_token',
  organization: 'your_github_organization'
};

const organizationName = 'your_organization_name';

axios({
  method: 'get',
  url: `${gitlabCredentials.host}/api/v4/groups/${organizationName}/projects`,
  headers: {
    'Private-Token': gitlabCredentials.token
  }
})
.then(response => {
  const gitlabRepos = response.data.map(project => ({ name: project.name, projectId: project.id }));
  console.log(gitlabRepos);

  gitlabRepos.forEach(async (repo) => {
    try {
        // Create a new repository on GitHub
        const createRepoResponse = await axios({        method: 'post',
        url: `https://api.github.com/orgs/${githubCredentials.organization}/repos`,
        headers: {
            'Authorization': `Token ${githubCredentials.token}`,
            'Content-Type': 'application/json'
        },
        data: {
            name: repo.name,
            private: false
        }
    });
    console.log(`Successfully created new repository ${repo.name} on GitHub`);

    // Get the GitLab repository URL
    const gitlabRepoUrl = (await axios({
        method: 'get',
        url: `${gitlabCredentials.host}/api/v4/projects/${repo.projectId}`,
        headers: {
        'Private-Token': gitlabCredentials.token
        }
    })).data.http_url_to_repo;
    console.log(`GitLab repository URL: ${gitlabRepoUrl}`);

    // Add the GitLab repository URL as source of the new repository on GitHub
    await axios({
        method: 'patch',
        url: createRepoResponse.data.url,
        headers: {
            'Authorization': `Token ${githubCredentials.token}`,
            'Content-Type': 'application/json'
        },
        data: {
            name: repo.name,
            private: false,
            git_url: gitlabRepoUrl
        }
    });
    console.log(`Successfully added ${gitlabRepoUrl} as source of ${repo.name} on GitHub`);
    } catch (err) {
        console.error(`Error migrating ${repo.name} from GitLab to GitHub: ${err}`);
    }
    });
  })
  .catch(function(err) {
    console.error(`Error getting GitLab repositories of ${organizationName}: ${err}`);
  });
