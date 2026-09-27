Conway's Game of Life Clone
Written by Frank Santen

Render link: https://a4-frank-santen.onrender.com/

The goal of this application was to practice using Canvas for the final project later. 
I did that by implementing Conway's game of life in the browser. It wasn't too difficult, 
as it's all just drawing squares onto the canvas. I ran into no major roadblocks during 
development, it took me about three hours in totality. 

I was a bit worried about the performance of iterating over a 2D array multiple times, so the 
2d array that stores the gamestate is only 16x16 (the widest you can zoom to is 12x12). So the 
simulation isn't the most accurate around the edges as cells can't expand past their 16x16 
border, but it doesn't really matter too much. 