import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import 'chartjs-adapter-date-fns';
import { Bar,Pie } from 'react-chartjs-2';

import { Chart as ChartJS } from 'chart.js/auto'
import { Chart }            from 'react-chartjs-2'

import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import './App.css';



import javascriptIcon from './assets/languages/javascript.png';
import pythonIcon from './assets/languages/python.png';
import javaIcon from './assets/languages/java.png';
import phpIcon from './assets/languages/php.png';
import htmlIcon from './assets/languages/html.png';
import cssIcon from './assets/languages/css.png';
import flutterIcon from './assets/languages/flutter.png';
import swiftIcon from './assets/languages/swift.png';
import androidIcon from './assets/languages/android.png';
import dartIcon from './assets/languages/dart.png';
import extjsIcon from './assets/languages/extjs.png';
import objectiveCIcon from './assets/languages/objective-c.png';
import rubyIcon from './assets/languages/ruby.png';
import shellIcon from './assets/languages/shell.png';

import cIcon from './assets/languages/c.png';
import cPlusPlusIcon from './assets/languages/c++.png';
import liquidIcon from './assets/languages/liquid.png';
import solidityIcon from './assets/languages/solidity.png';


const ACCESS_TOKEN = 'jJaUzHfSsSscFFK5XkBA';
const GITLAB_API_URL = 'https://harbor.beamzone.net/api/v4';
const ASSIGNEE_ID = 46;

const languageIcons = {
    Swift: swiftIcon,
    HTML: htmlIcon,
    CSS: cssIcon,
    Android: androidIcon,
    Dart: dartIcon,
    Extjs: extjsIcon,
    Flutter: flutterIcon,
    Java: javaIcon,
    JavaScript: javascriptIcon,
    'Objective-C': objectiveCIcon,
    Python: pythonIcon,
    Ruby: rubyIcon,
    Shell: shellIcon,
    PHP: phpIcon,
    C: cIcon,
    'C++': cPlusPlusIcon,
    Liquid: liquidIcon,
    Solidity: solidityIcon,
  };
  
  function App() {
    const [projects, setProjects] = useState({});
    const [loading, setLoading] = useState(true);
    const [issueTimelineData, setIssueTimelineData] = useState(null);
    const [contributionData, setContributionData] = useState([]);
    const [mergeRequests, setMergeRequests] = useState([]);
  
    useEffect(() => {
      const fetchIssuesAndProjects = async () => {
        try {
          let allIssues = [];
          let allMergeRequests = [];
          let page = 1;
          let totalPages = 1;
  
          while (page <= totalPages) {
            const response = await axios.get(`${GITLAB_API_URL}/issues`, {
              headers: { 'PRIVATE-TOKEN': ACCESS_TOKEN },
              params: {
                assignee_id: ASSIGNEE_ID,
                state: 'closed',
                per_page: 100,
                page,
                order_by: 'created_at',
                sort: 'desc',
              },
            });
  
            allIssues = [...allIssues, ...response.data];
            totalPages = parseInt(response.headers['x-total-pages'], 10) || 1;
            page += 1;
          }
  
          page = 1;
          totalPages = 1;
          while (page <= totalPages) {
            const response = await axios.get(`${GITLAB_API_URL}/merge_requests`, {
              headers: { 'PRIVATE-TOKEN': ACCESS_TOKEN },
              params: {
                assignee_id: ASSIGNEE_ID,
                state: 'closed',
                per_page: 100,
                page,
                order_by: 'created_at',
                sort: 'desc',
              },
            });
  
            allMergeRequests = [...allMergeRequests, ...response.data];
            totalPages = parseInt(response.headers['x-total-pages'], 10) || 1;
            page += 1;
          }
  
          const projectsMap = {};
          for (const issue of allIssues) {
            const projectId = issue.project_id;
            if (!projectsMap[projectId]) {
              const projectResponse = await axios.get(`${GITLAB_API_URL}/projects/${projectId}`, {
                headers: { 'PRIVATE-TOKEN': ACCESS_TOKEN },
              });
  
              const languagesResponse = await axios.get(`${GITLAB_API_URL}/projects/${projectId}/languages`, {
                headers: { 'PRIVATE-TOKEN': ACCESS_TOKEN },
              });
  
              projectsMap[projectId] = {
                title: projectResponse.data.name,
                description: projectResponse.data.description,
                languages: Object.keys(languagesResponse.data),
                issues: [],
                mergeRequests: [], // Add mergeRequests property
              };
            }
            projectsMap[projectId].issues.push(issue);
          }
  
          // Organize merge requests by project
          for (const mr of allMergeRequests) {
            const projectId = mr.project_id;
            if (projectsMap[projectId]) {
              projectsMap[projectId].mergeRequests.push(mr);
            }
          }
  
          setProjects(projectsMap);
          setLoading(false);
  
          const timelineData = prepareIssueTimelineData(allIssues);
          setIssueTimelineData(timelineData);
  
          const contributionData = prepareContributionData(allIssues);
          setContributionData(contributionData);
  
          setMergeRequests(allMergeRequests);
        } catch (error) {
          console.error('Error fetching issues and projects:', error);
          setLoading(false);
        }
      };
  
      fetchIssuesAndProjects();
    }, []);
  
    const prepareIssueTimelineData = (issues) => {
      const issuesByMonth = issues.reduce((acc, issue) => {
        const createdAt = new Date(issue.created_at);
        const month = createdAt.toLocaleString('default', { year: 'numeric', month: 'short' });
        if (!acc[month]) acc[month] = 0;
        acc[month] += 1;
        return acc;
      }, {});
  
      const labels = Object.keys(issuesByMonth);
      const data = Object.values(issuesByMonth);
  
      return {
        labels,
        datasets: [
          {
            label: 'Issues Assigned',
            data,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
          },
        ],
      };
    };
  
    const prepareContributionData = (issues) => {
      const contributions = issues.reduce((acc, issue) => {
        const closedAt = new Date(issue.closed_at);
        const date = closedAt.toISOString().split('T')[0];
        if (!acc[date]) acc[date] = 0;
        acc[date] += 1;
        return acc;
      }, {});
  
      return Object.keys(contributions).map((date) => ({
        date,
        count: contributions[date],
      }));
    };
  
    const prepareProjectPieData = (projects) => {
      const labels = Object.keys(projects).map((projectId) => projects[projectId].title);
      const data = Object.keys(projects).map((projectId) => projects[projectId].issues.length);
  
      return {
        labels,
        datasets: [
          {
            label: 'Issues per Project',
            data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
            ],
          },
        ],
      };
    };
  
    const cleanMergeRequestTitle = (title) => {
      var cleanedTitle = title.replace("Draft: Resolve ", '');
      cleanedTitle = cleanedTitle.replace("WIP: Resolve ", '');
      return cleanedTitle;
    };
  
    return (
      <div className="App">
        <body>
          <h1>GitLab Statistics</h1>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
              <CircularProgress />
            </Box>
          ) : (
            <div className="main-content container">
              <div className="chart-container pie-chart-container">
                <h2>Issues per Project</h2>
                <div style={{ width: '50%' }}>
                  <Pie data={prepareProjectPieData(projects)} />
                </div>
              </div>
              {Object.keys(projects).map((projectId) => (
                <div key={projectId} className="project">
                  <h2>{projects[projectId].title}</h2>
                  <p>Project Description: {projects[projectId].description || 'not available'}</p>
                  <p>Total Issues I worked on: {projects[projectId].issues.length}</p>
                  <h3>Project Languages:</h3>
                  <p>
                    {projects[projectId].languages.map((lang) => (
                      <img
                        key={lang}
                        src={languageIcons[lang] || '/assets/languages/default.png'}
                        alt={lang}
                        title={lang}
                        className="language-icon"
                      />
                    ))}
                  </p>
                  {projects[projectId].issues.length > 0 && (
                    <div>
                      <h3>Last issues I worked on:</h3>
                      <ul>
                        {projects[projectId].issues.slice(0, 4).map((issue) => (
                          <li key={issue.id}>{issue.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {projects[projectId].mergeRequests.length > 0 && (
                    <div>
                      <h3>Merge Requests History</h3>
                      <ul>
                        {projects[projectId].mergeRequests.map((mr) => (
                          <li key={mr.id}>
                            <strong>{cleanMergeRequestTitle(mr.title)}</strong> - {mr.state} - {new Date(mr.created_at).toLocaleDateString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </body>
      </div>
    );
  }
  
  export default App;