// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-xinlong-du",
    title: "Xinlong Du",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-projects",
          title: "projects",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-personal",
          title: "personal",
          description: "piano, biking, and other off-hours notes",
          section: "Navigation",
          handler: () => {
            window.location.href = "/personal/";
          },
        },{id: "post-enlargement-of-filtrations",
        
          title: "Enlargement of Filtrations",
        
        description: "A short introduction to filtration enlargement in probability theory.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/enlargement-of-filtrations/";
          
        },
      },{id: "news-my-personal-website-is-born-today",
          title: 'My personal website is born today!',
          description: "",
          section: "News",},{id: "projects-simbarepro",
          title: 'SimBaRepro',
          description: "Simulation-based, finite-sample inference for privatized data",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%64%75%33%33%39@%70%75%72%64%75%65.%65%64%75", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
