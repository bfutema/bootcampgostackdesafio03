module.exports = {
  up: QueryInterface => {
    return QueryInterface.bulkInsert(
      'students',
      [
        {
          name: 'Diego Fernandes',
          email: 'diego@gympoint.com',
          age: 23,
          weight: 60.5,
          height: 1.71,
          created_at: new Date(),
          updated_at: null,
        },
      ],
      {}
    );
  },

  down: () => {},
};
