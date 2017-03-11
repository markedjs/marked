'use strict';

var marked = require('marked');
var csv = require('csv-string');
var html = require('escape-html');

// Enable plugins for all instances
marked.setOptions({plugins: true});

// Initialize renderer
var renderer = new marked.Renderer({
  plugins: {
    // Convert `@link(title,url)` into link.
    links: function(params, block) {
      var parts = params.split(/\s*,\s*/);
      return '<a href="' + html(parts[1]) + '">' + html(parts[0]) + '</a>';
    },

    // Convert `@github(user/repo)` into github link.
    github: function(params, block) {
      return '<a href="https://github.com/' + html(params) + '">' + html(params) + '</a>';
    },

    // Convert `@csv(headers)` block data into table.
    csv: function(params, block) {
      var thead = params.length ? params.split(/\s*,\s*/) : null;
      var tbody = csv.parse(block);

      var table = ['<table>']; // Use array to avoid string reallocations
      if (thead) {
        table.push('<thead><tr>');
        thead.forEach(function(heading) {
          table.push('<th>' + html(heading) + "</th>");
        });
        table.push('</tr></thead>');
      }
      table.push('<tbody>');
      tbody.forEach(function(row) {
        table.push('<tr>');
        row.forEach(function(cell) {
          table.push('<td>' + html(cell) + "</td>");
        });
        table.push('</tr>');
      });
      table.push('</tbody></table>');

      return table.join('\n');
    },
    gallery(params, block) {
      var gallery = ['<ul class="imageGallery">'];
      block.replace(/^\s+|\s+$/gm, '').split(/\s+\r?\n\s+/).forEach(function(img) {
        gallery.push('<li class="imageGallery-item"><img src="' + html(img) + '"/></li>');
      });
      gallery.push('</ul>');
      return gallery.join('\n');
    }
  }
});

// Add plugin to initialized renderer.
// Parse block of markdown inside markdown. Yep even so :)
renderer.plugins.markdown = function(params, block) {
  return marked(block, {renderer: this});
};
