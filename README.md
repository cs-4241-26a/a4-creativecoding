## UK Crime Visualization

https://a4-charles-russell.onrender.com

I built a site that visualizes crime data using it's longitude, latitude, the crime id, crime type, and LSOA code. It generates a math function to graph it as, uses the lon/lat as the starting point, generates a color from the crime id, and uses the LSOA code as a seed to randomly choose the math function the crime is graphed as. 
The goal of the site was to generate something fun to look at from data.

The site was time consuming to create but not extremely challenging. The most difficult part was putting together the d3.js for plotting the functions. The tedium of the code was easily the hardest part.

While making the site, I used Claude to assist me with building the file structure and setting up function stubs to achieve my desired goal of a data visualizer. Additionally, I used it to expedit debugging after I had taken a shot at fixing the bug to assist with solving it or tracking it down. I gave it the assignment details, a claude created summary of the work I've done with express prior, and the server.js file from A2/A3 to build the function stubs and file structure.