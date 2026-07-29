describe('public Quest discovery', () => {
  it('filters real Quest data and opens the selected Quest detail', () => {
    cy.intercept({
      method: 'GET',
      pathname: '/api/v1/quests',
    }).as('questList');
    cy.visit('/quests');

    cy.wait('@questList')
      .its('response.statusCode')
      .should('equal', 200);
    cy.get('h1').contains('Discover eco quests').should('be.visible');

    cy.contains('button', 'Observe & Measure').click();
    cy.wait('@questList')
      .its('response.statusCode')
      .should('equal', 200);
    cy.location('search').should('include', 'category=ObserveMeasure');

    cy.get('input[aria-label="Search quests"]')
      .type('Water Quality Monitoring{enter}');
    cy.wait('@questList')
      .its('response.statusCode')
      .should('equal', 200);
    cy.location('search').should('include', 'search=Water+Quality+Monitoring');
    cy.contains('1 quest found').should('be.visible');

    cy.intercept({
      method: 'GET',
      pathname: '/api/v1/quests/*',
    }).as('questDetail');
    cy.get('a[aria-label="Water Quality Monitoring"]').click();

    cy.wait('@questDetail')
      .its('response.statusCode')
      .should('equal', 200);
    cy.location('pathname')
      .should('match', /^\/quests\/11111111-1111-4111-8111-111111111105$/);
    cy.get('h1').contains('Water Quality Monitoring').should('be.visible');
    cy.get('section[aria-label="Quest details"]').should('be.visible');
    cy.get('h2').contains('About this quest').should('be.visible');
    cy.contains('Monitor and report water quality in local waterways.')
      .should('be.visible');
  });
});
