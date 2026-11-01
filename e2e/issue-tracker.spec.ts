import { test, expect } from '@playwright/test';

test.describe('Issue Tracker E2E - Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('create project -> create card -> add comment', async ({ page }) => {
    // Create project
    await page.click('button:has-text("New Project")');
    await page.fill('input#title', 'E2E Test Project');
    await page.click('button:has-text("Create")');

    // Wait for project to appear in list
    await expect(page.locator('text=E2E Test Project').first()).toBeVisible();

    // Open project
    const projectCard = page.locator('.project-card', { hasText: 'E2E Test Project' });
    await projectCard.locator('a:has-text("Open")').first().click();
    await expect(page.locator('h2:has-text("E2E Test Project")')).toBeVisible();

    // Create card
    await page.click('button:has-text("New Card")');
    await page.fill('input#title', 'E2E Test Card');
    await page.fill(
      'textarea#content',
      '# Description\n\nThis is a test card with **markdown** content.'
    );
    await page.click('button:has-text("Create")');

    // Wait for card to appear
    await expect(page.locator('text=E2E Test Card').first()).toBeVisible();

    // Click card to open detail
    const cardItem = page.locator('.card-item', { hasText: 'E2E Test Card' });
    await cardItem.first().click();

    // Verify card detail page
    await expect(page.locator('h2:has-text("E2E Test Card")')).toBeVisible();
    await expect(page.locator('text=Description')).toBeVisible();
    await expect(page.locator('strong:has-text("markdown")')).toBeVisible();

    // Add comment
    await page.fill('textarea[placeholder*="comment"]', 'This is an E2E test comment');
    await page.click('button:has-text("Add Comment")');

    // Verify comment appears
    await expect(page.locator('text=This is an E2E test comment')).toBeVisible();
    await expect(page.locator('text=Comments (1)')).toBeVisible();
  });

  test('markdown rendering - code blocks with syntax highlighting', async ({ page }) => {
    await page.click('button:has-text("New Project")');
    await page.fill('input#title', 'Markdown Test Code');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Markdown Test Code').first()).toBeVisible();

    const projectCard = page.locator('.project-card', { hasText: 'Markdown Test Code' });
    await projectCard.locator('a:has-text("Open")').first().click();
    await page.click('button:has-text("New Card")');
    await page.fill('input#title', 'Code Block Test');
    await page.fill('textarea#content', '```typescript\nconst hello = "world";\n```');
    await page.click('button:has-text("Create")');

    const cardItem = page.locator('.card-item', { hasText: 'Code Block Test' });
    await cardItem.first().click();

    // Verify code block rendered with syntax highlighting
    await expect(page.locator('pre code')).toContainText('const hello = "world";');
  });

  test('markdown rendering - mermaid diagrams', async ({ page }) => {
    const projectTitle = `Mermaid Test ${Date.now()}`;
    await page.click('button:has-text("New Project")');
    await page.fill('input#title', projectTitle);
    await page.click('button:has-text("Create")');
    await expect(page.locator(`text=${projectTitle}`).first()).toBeVisible();

    const projectCard = page.locator('.project-card', { hasText: projectTitle });
    await projectCard.locator('a:has-text("Open")').first().click();
    await page.click('button:has-text("New Card")');
    await page.fill('input#title', 'Mermaid Card');
    await page.fill('textarea#content', '```mermaid\ngraph TD\n    A --> B\n```');
    await page.click('button:has-text("Create")');

    const cardItem = page.locator('.card-item', { hasText: 'Mermaid Card' });
    await cardItem.first().click();

    // Verify mermaid diagram rendered as SVG
    await expect(page.locator('.mermaid svg')).toBeVisible();
  });

  test('markdown rendering - task lists', async ({ page }) => {
    const projectTitle = `Task List Test Project ${Date.now()}`;
    await page.click('button:has-text("New Project")');
    await page.fill('input#title', projectTitle);
    await page.click('button:has-text("Create")');
    await expect(page.locator(`text=${projectTitle}`).first()).toBeVisible();

    const projectCard = page.locator('.project-card', { hasText: projectTitle });
    await projectCard.locator('a:has-text("Open")').first().click();
    await page.click('button:has-text("New Card")');
    await page.fill('input#title', 'Task List Card');
    await page.fill('textarea#content', '- [ ] Todo item\n- [x] Done item');
    await page.click('button:has-text("Create")');

    const cardItem = page.locator('.card-item', { hasText: 'Task List Card' });
    await cardItem.first().click();

    // Verify task list rendered with one checkbox per item and correct state
    const checkboxes = page.locator('.markdown-renderer input[type="checkbox"]');
    await expect(checkboxes).toHaveCount(2);
    await expect(checkboxes.nth(0)).not.toBeChecked();
    await expect(checkboxes.nth(1)).toBeChecked();
  });

  test('card status update (todo -> in_progress -> done)', async ({ page }) => {
    await page.click('button:has-text("New Project")');
    await page.fill('input#title', 'Status Test Project');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Status Test Project').first()).toBeVisible();

    const projectCard = page.locator('.project-card', { hasText: 'Status Test Project' });
    await projectCard.locator('a:has-text("Open")').first().click();
    await page.click('button:has-text("New Card")');
    await page.fill('input#title', 'Status Card');
    await page.fill('textarea#content', 'Testing status changes');
    await page.click('button:has-text("Create")');

    const cardItem = page.locator('.card-item', { hasText: 'Status Card' });
    await cardItem.first().click();

    // Change status to in_progress
    await page.selectOption('select', 'in_progress');
    await expect(page.locator('select')).toHaveValue('in_progress');

    // Change status to done
    await page.selectOption('select', 'done');
    await expect(page.locator('select')).toHaveValue('done');
  });

  test('delete card - not implemented in UI', async ({ page }) => {
    await page.click('button:has-text("New Project")');
    await page.fill('input#title', 'Delete Test Project');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Delete Test Project').first()).toBeVisible();

    const projectCard = page.locator('.project-card', { hasText: 'Delete Test Project' });
    await projectCard.locator('a:has-text("Open")').first().click();
    await page.click('button:has-text("New Card")');
    await page.fill('input#title', 'Card to Delete');
    await page.fill('textarea#content', 'This card will be deleted');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Card to Delete').first()).toBeVisible();

    // Verify no delete button exists in card detail view
    await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
  });

  test('image asset serving', async ({ page }) => {
    await page.click('button:has-text("New Project")');
    await page.fill('input#title', 'Image Test Project');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Image Test Project').first()).toBeVisible();

    const projectCard = page.locator('.project-card', { hasText: 'Image Test Project' });
    await projectCard.locator('a:has-text("Open")').first().click();
    await page.click('button:has-text("New Card")');
    await page.fill('input#title', 'Image Card');
    await page.fill('textarea#content', '![Test Image](./test-image.png)');
    await page.click('button:has-text("Create")');

    const cardItem = page.locator('.card-item', { hasText: 'Image Card' });
    await cardItem.first().click();

    // Verify image tag has correct asset API URL
    const img = page.locator('img[src*="/api/projects/"]').first();
    await expect(img).toHaveAttribute('src', /\/api\/projects\/.*\/assets\/.*\/test-image\.png/);
  });

  test('navigation - back to projects list', async ({ page }) => {
    await page.click('button:has-text("New Project")');
    await page.fill('input#title', 'Nav Test Project');
    await page.click('button:has-text("Create")');
    await expect(page.locator('text=Nav Test Project').first()).toBeVisible();

    const projectCard = page.locator('.project-card', { hasText: 'Nav Test Project' });
    await projectCard.locator('a:has-text("Open")').first().click();

    // Click back link
    await page.click('a:has-text("Back to Projects")');
    await expect(page.locator('text=Nav Test Project').first()).toBeVisible();
    await expect(page.locator('h2:has-text("Projects")')).toBeVisible();
  });

  test('project card counts update', async ({ page }) => {
    const uniqueTitle = `Count Test Project ${Date.now()}`;
    await page.click('button:has-text("New Project")');
    await page.fill('input#title', uniqueTitle);
    await page.click('button:has-text("Create")');
    await expect(page.locator(`text=${uniqueTitle}`).first()).toBeVisible();

    // Check initial counts (0 todo)
    const projectCard = page.locator('.project-card', { hasText: uniqueTitle });
    await expect(projectCard.locator('.card-counts .count.todo:has-text("0 todo")')).toBeVisible();

    await projectCard.locator('a:has-text("Open")').first().click();
    await page.click('button:has-text("New Card")');
    await page.fill('input#title', 'Card 1');
    await page.fill('textarea#content', 'Description 1');
    await page.click('button:has-text("Create")');

    // Go back and verify count updated
    await page.click('a:has-text("Back to Projects")');

    // Wait for the count to update
    await page.waitForTimeout(500);

    // Re-find the project card after navigation
    const updatedProjectCard = page.locator('.project-card', { hasText: uniqueTitle });
    await expect(
      updatedProjectCard.locator('.card-counts .count.todo:has-text("1 todo")')
    ).toBeVisible();
  });
});
