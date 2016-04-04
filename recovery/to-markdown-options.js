module.exports = {
  converters: [
    {
      filter: 'div',
      replacement: function(content) {
        return '\n\n' + content;
      }
    },
    {
      filter: 'span',
      replacement: function(content) {
        return content;
      }
    },
    {
      filter: 'u',
      replacement: function(content) {
        return content;
      }
    },
    {
      filter: 'font',
      replacement: function(content) {
        return content;
      }
    }
  ]
};
