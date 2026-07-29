describe('authenticated Member mission and Passport', () => {
  it('signs in through the UI and loads authoritative Member progress', () => {
    cy.env(['E2E_MEMBER_EMAIL', 'E2E_MEMBER_PASSWORD']).then(
      ({ E2E_MEMBER_EMAIL, E2E_MEMBER_PASSWORD }) => {
        expect(
          E2E_MEMBER_EMAIL,
          'Set CYPRESS_E2E_MEMBER_EMAIL to an enabled Development Member persona.',
        ).to.be.a('string');
        expect(E2E_MEMBER_EMAIL).not.to.equal('');
        expect(
          E2E_MEMBER_PASSWORD,
          'Set CYPRESS_E2E_MEMBER_PASSWORD to its ignored Development-only password.',
        ).to.be.a('string');
        expect(E2E_MEMBER_PASSWORD).not.to.equal('');

        cy.clearCookies();
        cy.intercept({
          method: 'POST',
          pathname: '/api/v1/auth/login',
        }).as('login');
        cy.intercept({
          method: 'GET',
          pathname: '/api/v1/users/me/participations',
        }).as('participations');
        cy.intercept({
          method: 'GET',
          pathname: '/api/v1/users/me/passport/completions',
        }).as('passportCompletions');
        cy.intercept({
          method: 'GET',
          pathname: '/api/v1/users/me/passport',
        }).as('passportSummary');

        cy.visit('/login');
        cy.get('input[type="email"]').type(E2E_MEMBER_EMAIL, { log: false });
        cy.get('input[type="password"]').type(E2E_MEMBER_PASSWORD, { log: false });
        cy.contains('button', 'Sign in').click();

        cy.wait('@login')
          .its('response.statusCode')
          .should('equal', 200);
        cy.location('pathname').should('equal', '/');
        cy.get('a[aria-label="Profile settings"]')
          .should('contain.text', 'Test Member 1');

        cy.get('nav[aria-label="Primary navigation"] a[href="/my-quests"]')
          .click();
        cy.wait('@participations')
          .its('response.statusCode')
          .should('equal', 200);
        cy.wait('@passportCompletions')
          .its('response.statusCode')
          .should('equal', 200);
        cy.location('pathname').should('equal', '/my-quests');
        cy.get('h1').contains('Mission Board').should('be.visible');
        cy.get('section[aria-label="Recent progress"]')
          .contains('Passport preview')
          .should('be.visible');

        cy.contains('a', 'View full').click();
        cy.wait('@passportSummary')
          .its('response.statusCode')
          .should('equal', 200);
        cy.location('pathname').should('equal', '/passport');
        cy.get('h1').contains('Test Member 1 — Passport').should('exist');
        cy.get('.kiwi-topography')
          .should('contain.text', 'Test Member 1')
          .and('contain.text', 'Level 3')
          .and('contain.text', 'Total XP:')
          .and('contain.text', '150 XP')
          .and('contain.text', '2 verified Quests');
        cy.get('h2').contains('Completion history').should('be.visible');
        cy.get('[aria-label="Completion history filter"]').should('be.visible');
      },
    );
  });
});
